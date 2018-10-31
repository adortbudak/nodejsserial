const SerialPort = require('serialport');
const colors = require('colors');
const moment = require('moment');


const port = new SerialPort('/dev/tty.usbserial-A105DBCQ',{
    baudRate: 9600,
    stopBits:1,
    parity: 'none',
    dataBits: 8,
    autoOpen: false
})

var messageLength = 0;
let incomingBytes = Buffer.alloc(0);
let pendingBytes = Buffer.alloc(0);
let message = [];
const gatewaySerialNumber = '12489860';
const serialDeviceList = ['10362246','10268203']

port.open(function(err) {
    if (err) {
        return console.log('Error opening port: ', err.message)
    }
})

port.on('open', function(){
    console.log('Port Opened Succesfully');
});

port.on('data',function(data){
    let totalLength = incomingBytes.length + data.length;
    incomingBytes = Buffer.concat([incomingBytes,data]);    
    
    //clean up partial data this could happen is serial port is opened and received data while during existing data pushed
    while (incomingBytes.length > 0  && incomingBytes[0] != 0x72 && incomingBytes[0] != 0X1C && messageLength == 0)
    {
        console.log(colors.red("Bytes discarded: ", incomingBytes[0]));
        incomingBytes = incomingBytes.slice(1);    
    } 

    if (incomingBytes.length > 0)
    {        
        if (pendingBytes.length < messageLength && incomingBytes.length > 0)
        {
            let temp = Buffer.alloc(0);
            temp = incomingBytes.slice(0,messageLength-pendingBytes.length);
            pendingBytes = Buffer.concat([pendingBytes,temp]);    
            incomingBytes = incomingBytes.slice(temp.length);
        }
        if (pendingBytes.length == 0 && incomingBytes.length > 2)
        {
            messageLength = incomingBytes[1] + 1;
            if (incomingBytes.length <= messageLength)
            {
                pendingBytes = Buffer.from(incomingBytes);                
                incomingBytes = incomingBytes.slice(pendingBytes.length);                
            }
        }   
        if (pendingBytes.length == messageLength)
        {            
            process({...pendingBytes});
         
            pendingBytes = Buffer.alloc(0);
            messageLength = 0;
        }        
    }
});

async function process(pendingBytes){
    if (pendingBytes[0] == 0x72)
    {                
        const timeStamp = moment();
        const deviceSerialNumber = (pendingBytes[3] << 16) + (pendingBytes[4] << 8) + (pendingBytes[5]);
        console.log("Serial number: ", timeStamp.format("h:mm:ss SSS"), deviceSerialNumber)
    }
}

/*port.on('data', function(data){
    
     data.forEach(element => {
        incomingBytes.push(element);        
    }); 


    //clean up partial data this could happen is serial port is opened and received data while during existing data pushed
    while (incomingBytes.length > 0  && incomingBytes[0] != 0x72 && incomingBytes[0] != 0X1C && messageLength == 0)
    {
        console.log(colors.red("Bytes discarded: ", incomingBytes[0]));
        incomingBytes.shift();        
    }   
    

    if (incomingBytes.length > 0)
    {
        //Set new message length
        if (messageLength == 0 && incomingBytes.length > 2)
        {
            messageLength = incomingBytes[1] + 1;
        }       
        
        //Complete the message
        while (incomingBytes.length > 0 && message.length < messageLength)
        {
            message.push(incomingBytes[0]);
            incomingBytes.shift();
        }       

        //Check if message is completed
        if (message.length > 0 && message.length == messageLength)
        {
            messageLength = 0;
            totalRequestsCaptured++;
            // Put built message back into a new Buffer to calculate bit operations
            //const buf = Buffer.from(message);
            if (message[0] == 0x72)
            {
                
                const deviceSerialNumber = (message[3] << 16) + (message[4] << 8) + (message[5]);

                var found = serialDeviceList.find(function(element)
                {
                    return element == deviceSerialNumber;
                })               

                if (found)
                {                  
                    const originatorDeviceSerialNumber = (message[3] << 16) + (message[4] << 8) + (message[5]);
                    const firstHop = (message[7] << 16) + (message[8] << 8) + (message[9]);
                    const messageClass = message[12];    

                    if (messageClass == 0x3E)
                    {                    
                        let appFlag = '';
                        switch (message[14]) {
                            case 0x00:
                                appFlag = 'None';
                                break;
                            case 0x01:
                                appFlag = 'Alarm 1';
                                break;
                            case 0x80:
                                appFlag = 'Tamper';
                                break;
                            default:
                                appFlag = 'NaN'
                        }
                        console.log(colors.green("Application Flag", appFlag));

                        let statusFlag = ''
                        switch (message[15]) {
                            case 0x00:
                                statusFlag = 'None';
                                break;
                            case 0x04:
                                statusFlag = 'Battery Missing';
                                break;
                            case 0x20:
                                statusFlag = 'Tamper';
                                break;
                            default:
                                statusFlag = 'NaN'
                        }
                        console.log("Status Flag", statusFlag);
                    }
                    if (messageClass == 0x02)
                    {
                        console.log("Aggregated")
                    }
                    if (messageClass == 0x41)
                    {
                        console.log("Repeater Status")
                    }

                    console.log(colors.bgMagenta('Device Serial Number', deviceSerialNumber ));       
                    console.log(colors.bgMagenta('Originator Serial Number', originatorDeviceSerialNumber ));
                    console.log(colors.bgMagenta('First Hop Serial Number', firstHop ));
                }

                //console.log(colors.green("New message: ", message));   
                

                
            } else if (message[0] == 0X1C) 
            {
                console.log(colors.yellow("Supervisory message is received"));
                let appFlag = '';
                    switch (message[4]) {
                        case 0x00:
                            appFlag = 'None';
                            break;
                        case 0x01:
                            appFlag = 'Alarm 1';
                            break;
                        case 0x80:
                            appFlag = 'Tamper';
                            break;
                        default:
                            appFlag = 'NaN'
                    }
                    console.log(colors.yellow("Application Flag", appFlag));
                    let statusFlag = ''
                    switch (message[5]) {
                        case 0x00:
                            statusFlag = 'None';
                            break;
                        case 0x04:
                            statusFlag = 'Battery Missing';
                            break;
                        case 0x20:
                            statusFlag = 'Tamper';
                            break;
                        default:
                            statusFlag = 'NaN'
                    }
                    console.log(colors.yellow("Status Flag", statusFlag));
            }      
            // console.log(colors.blue("Total Requests Received: ",totalRequestsCaptured));     
            // console.log(colors.blue(buf));
            message = [];      
        }
    }     
})*/


