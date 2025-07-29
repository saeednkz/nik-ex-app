const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
const SPREADSHEET_ID = "16tcx7eRuVLgK3sEnIzTB-FLsnoMrIInDnEGCnJbMmso";
const SHEET_NAME = "transactions";
const SERVICE_ACCOUNT_KEY_FILE = "./service-account.json"; // Name of your JSON key file

// Define columns based on your sheet structure
const COLUMNS = {
    DATE: 0, // A
    ITEM_NAME: 1, // B
    TX_TYPE: 2, // C
    AMOUNT: 3, // D
    PRICE: 4, // E
    WALLET: 5, // F
    CUSTOMER_ID: 6, // G
    STATUS: 7, // H
};

// Main function to be scheduled
exports.syncSheetWithFirestore = functions.region('europe-west1').runWith({ timeoutSeconds: 300 }).pubsub.schedule('every 5 minutes').onRun(async (context) => {
    try {
        console.log("Starting Google Sheet sync...");

        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY_FILE,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const sheets = google.sheets({ version: "v4", auth });

        // 1. Read all data from the sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:H`, // Read columns A to H
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log("No data found in the sheet.");
            return null;
        }

        // Find all items from Firestore once to avoid multiple reads
        const itemsSnapshot = await db.collection("items").get();
        const itemsMap = new Map();
        itemsSnapshot.forEach(doc => {
            itemsMap.set(doc.data().name.toLowerCase(), { id: doc.id, ...doc.data() });
        });

        const rowsToUpdate = [];

        // 2. Process each row
        for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
            const row = rows[i];
            const status = row[COLUMNS.STATUS];

            // Process only rows that are not marked as 'imported'
            if (status && status.toLowerCase() === 'imported') {
                continue;
            }

            const itemName = row[COLUMNS.ITEM_NAME];
            if (!itemName) {
                console.log(`Skipping row ${i + 1} due to missing item name.`);
                continue;
            }

            console.log(`Processing row ${i + 1}: ${itemName}`);

            // 3. Find or create the item in Firestore
            let item = itemsMap.get(itemName.toLowerCase());
            if (!item) {
                console.log(`Item "${itemName}" not found. Creating new item...`);
                const newItemRef = await db.collection("items").add({
                    name: itemName,
                    type: "محصول", // Default to 'product', can be adjusted
                    symbol: "",
                    poolInventory: 0,
                    avgRate: 0,
                    netProfit: 0,
                    totalBuys: 0,
                    totalSells: 0,
                    archived: false,
                });
                item = { id: newItemRef.id, name: itemName, poolInventory: 0, avgRate: 0, netProfit: 0, totalBuys: 0, totalSells: 0 };
                itemsMap.set(itemName.toLowerCase(), item); // Add to map to avoid re-creating
            }

            // 4. Create transaction and update item using a Firestore transaction
            const txType = row[COLUMNS.TX_TYPE] === 'فروش' ? 'فروش' : 'تامین/خرید';
            const amount = parseFloat(row[COLUMNS.AMOUNT]) || 0;
            const price = parseFloat(row[COLUMNS.PRICE]) || 0;

            await db.runTransaction(async (t) => {
                const itemRef = db.collection("items").doc(item.id);
                const itemDoc = await t.get(itemRef);
                const itemData = itemDoc.data();
                
                let profitOrLoss = 0;
                // Simplified profit/loss logic - adjust as needed
                if (txType === 'فروش') {
                    if (itemData.poolInventory < amount) {
                        throw new Error(`Not enough inventory for ${item.name}.`);
                    }
                    profitOrLoss = (price - itemData.avgRate) * amount;
                    itemData.poolInventory -= amount;
                    itemData.totalSells += 1;
                } else { // تامین/خرید
                    const oldTotalValue = itemData.avgRate * itemData.poolInventory;
                    const newTotalValue = oldTotalValue + (price * amount);
                    itemData.poolInventory += amount;
                    itemData.avgRate = itemData.poolInventory > 0 ? newTotalValue / itemData.poolInventory : price;
                    itemData.totalBuys += 1;
                }
                itemData.netProfit += profitOrLoss;
                
                t.update(itemRef, itemData);

                const newTransactionRef = db.collection("transactions").doc();
                t.set(newTransactionRef, {
                    date: row[COLUMNS.DATE] || new Date().toLocaleDateString('fa-IR-u-nu-latn'),
                    itemName: item.name,
                    itemType: item.type,
                    type: txType,
                    amount: amount,
                    price: price,
                    wallet: row[COLUMNS.WALLET] || 'Google Sheet',
                    customerId: row[COLUMNS.CUSTOMER_ID] || '',
                    profitOrLoss: profitOrLoss,
                    itemId: item.id,
                    id: newTransactionRef.id,
                });
            });

            // Mark row for update in the sheet
            rowsToUpdate.push({
                range: `${SHEET_NAME}!H${i + 1}`,
                values: [['imported']],
            });
        }

        // 5. Update the Google Sheet in a single batch request
        if (rowsToUpdate.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: {
                    valueInputOption: "RAW",
                    data: rowsToUpdate,
                },
            });
            console.log(`${rowsToUpdate.length} rows successfully synced and updated.`);
        } else {
            console.log("No new rows to sync.");
        }

        return null;
    } catch (err) {
        console.error("Error syncing with Google Sheet:", err);
        return null;
    }
});