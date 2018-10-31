const SerialPort = require('serialport');

const port = new SerialPort('COM3',{
    baudRate: 57600,
    autoOpen: false
})

port.open(function(err) {
    if (err) {
        return console.log('Error opening port: ', err.message)
    }
})

port.on('open', function(){
    console.log('Port Opened Succesfully');
});

port.write('New Data');