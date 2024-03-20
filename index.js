const bluetoothSerial = require('bluetooth-serial-port');
const qr = require('qrcode');

const printerAddress = 'XX:32:XX:AX:XX:A5';

function connectToPrinter(address) {
  return new Promise((resolve, reject) => {
    const bluetoothSerialPort = new bluetoothSerial.BluetoothSerialPort();
    bluetoothSerialPort.findSerialPortChannel(address, (channel) => {
      bluetoothSerialPort.connect(address, channel, () => {
        console.log('Connected to printer.');
        resolve(bluetoothSerialPort);
      }, (error) => {
        reject(`Error connecting to printer: ${error}`);
      });
    });
  });
}


function createRestaurantReceipt(printer) {

  return new Promise((res,rej)=>{
    
  const qrCodeData = 'some data';

// Generate the QR code
qr.toDataURL(qrCodeData, (err, url) => {
  if (err) {
    console.error(err);
    return;
  }

  // Embed the QR code image in your receipt
  const qrCodeImage = `\x1b\x61\x00${url}\x1b\x61\x01`;

  const printCommands = Buffer.from(`\x1D\x76\x30\x00${url}`, 'hex');

  var receiptContent = `
\x1b\x61\x01
Your Restaurant
Logo Here
123 Main Street
City, State, ZIP
Phone: 123-456-7890
------------------------------------------------
Invoice: #123456      Date: 2023-12-31
------------------------------------------------
\x1b\x61\x00
Qty    Description             Price      Total  
------------------------------------------------
 2     Item 1                  $10.00     $20.00
 1     Item 2                  $5.00      $5.00
------------------------------------------------
\x1b\x61\x02
Subtotal:             $25.00
Tax (10%):            $2.50
------------------------------------------------
Grand Total:          $27.50
------------------------------------------------
\x1b\x61\x01
Thank you for
your visit!
\x1d\x56\x00
${qrCodeImage}
`;

const qrBytes = Buffer.from(qrCodeData, 'ascii');
    const dataLength = qrBytes.length + 3;
    const dataPL = dataLength % 380;
    const dataPH = Math.floor(dataLength / 380);
  
    const bytes = Buffer.concat([
        Buffer.from([0x1D, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x33, 0x00]),
        Buffer.from([0x1D, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x05]),
        Buffer.from([0x1D, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]),
        Buffer.from([0x1D, 0x28, 0x6B, dataPL, dataPH, 0x31, 0x50, 0x30]),
        qrBytes,
        Buffer.from([0x1D, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
    ]);
  // Convert the receipt content to a buffer
  const bufferData = Buffer.from(bytes);
    printer.write(bytes, () => {
      console.log('Receipt sent successfully.');
    });
  // res(printCommands) ;
  })
})

}

function sendReceipt(printer) {
  // Simple receipt content
  this.createRestaurantReceipt().then(receiptContent =>{
    // Convert the receipt content to a buffer
  const bufferData = Buffer.from(receiptContent, 'utf-8');

  return new Promise((resolve, reject) => {
    printer.write(bufferData, () => {
      console.log('Receipt sent successfully.');
      resolve();
    });
  });
  })  

  
}

// Connect to the Bluetooth printer
connectToPrinter(printerAddress)
  .then((printer) => {
    // Send the receipt data
    createRestaurantReceipt(printer)
      .then(() => {
        // Close the connection when done
        printer.close(() => {
          console.log('Connection closed.');
        });
      })
      .catch((error) => {
        console.error(`Error sending receipt: ${error}`);
      });
  })
  .catch((error) => {
    console.error(`Error connecting to printer: ${error}`);
  });
