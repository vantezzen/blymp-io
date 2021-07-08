/**
 * Handle socket connections and transfers
 */
const debug = require('debug')('blymp:socket');

// Current file transfers
const transfers = {};

// blymp tries to use easier to remeber 4-digit codes instead of just using
// random ones. For this, blymp uses different generators
const easyCodesGenerators = [
  // Codes in format 1122, 5533, 2288 etc.
  () => {
    let num1 = Math.floor(Math.random() * 9 + 1);
    let num2 = Math.floor(Math.random() * 9 + 1);
    return Number(`${num1}${num1}${num2}${num2}`);
  },
  
  // Codes in format 1221, 5225, 8118, 9449 etc.
  () => {
    let num1 = Math.floor(Math.random() * 9 + 1);
    let num2 = Math.floor(Math.random() * 9 + 1);
    return Number(`${num1}${num2}${num2}${num1}`);
  },
  
  // Codes in format 1212, 4545, 8383 etc.
  () => {
    let num1 = Math.floor(Math.random() * 9 + 1);
    let num2 = Math.floor(Math.random() * 9 + 1);
    return Number(`${num1}${num2}${num1}${num2}`);
  },
];

const generateTransferCode = () => {
  // Try generating an easy code
  // If we can't find a free one after 10 tries, use a random code instead
  for(let i = 0; i < 10; i++) {
    const generator = easyCodesGenerators[Math.floor(Math.random() * easyCodesGenerators.length)];
    const code = generator();
    if (!transfers[code]) {
      return code;
    }
  }
  
  // Find code that is still unused
  let id;
  do {
    id = Math.floor(Math.random() * 8999 + 1000);
  } while (transfers[id]);
  return id;
};

// Create new transfer connection
const newTransfer = (socket) => {
  // Find code that is still unused
  let id = generateTransferCode();

  // Add id to transfers list
  transfers[id] = {
    sender: false, // Socket ID of the file sender
    senderPeer: false, // Peer signal of the sender
    receiver: socket.id, // Socket ID of the receiver
    receiverPeer: false, // Peer signal of the receiver
    code: id, // receiver ID
    complete: false, // Has the transfer been completed?
    method: 'webrtc', // Method of transmitting ('webrtc' or 'socket')
    file: false, // Information about current file (not in use)
    locked: false, // Is this transfer locked?
    numberOfFiles: 1, // Number of files being transmitted
    currentFile: 0, // Index of current file
    created: (+new Date()), // Timestamp this transfer has been created (for garbage collection)
    lastActivity: (+new Date()), // Last time this transfer had any activity
  };

  return id;
};

/**
 * Setup socket server
 * @prop io Socket IO server
 */
module.exports = function setupSockets(io) {
  // Handle socket connections
  io.on('connection', (socket) => {
    debug('New connection');

    let socketInCooldown = false;
    let numFailedConnections = 0;
    let isShadowBanned = false;

    // Generate new receiver ID
    socket.on('new receiver id', (method, callback) => {
      if (isShadowBanned) {
        return;
      }

      // Make sure the socket doesn't already have an active transfer
      const activeTransfer = Object.values(transfers).find(e => e.receiver === socket.id);
      if (activeTransfer && activeTransfer.code) {
        callback(activeTransfer.code);
        return;
      }

      // Create a new transfer for this socket
      const id = newTransfer(socket);

      // Check if WebRTC unsupported, fallback to socket
      if (method !== 'webrtc') {
        transfers[id].method = 'socket';
      }
      debug(`new rec id: ${id}`);
      callback(id);
    });

    // Set peer signal and send to partner
    socket.on('set peer signal', (peerSignal, id, isSender) => {
      if (isShadowBanned) {
        return;
      }

      if (!id) return;
      if (!transfers[id]) return;

      // Make sure socket is actually in this transfer
      const transfer = transfers[id];
      if (isSender && transfer.sender !== socket.id) return;
      if (!isSender && transfer.receiver !== socket.id) return;

      if (!isSender) {
        transfers[id].receiverPeer = peerSignal;

        io.to(transfers[id].sender).emit('got partner peer', peerSignal);
      } else {
        transfers[id].senderPeer = peerSignal;

        io.to(transfers[id].receiver).emit('got partner peer', peerSignal);
      }
    });

    // Trying to use receiver id for transfer
    socket.on('use receiver id', (id, method, callback) => {
      // Cooldown to prevent brute-forcing
      if (socketInCooldown || isShadowBanned) {
        debug('Socket tried to use Socket ID but is in cooldown or shadow ban');
        callback(false, '');
        numFailedConnections += 1;
        return;
      }

      if (!id) return;

      // Check if receiver ID exists and user is not shadow-banned
      if (transfers[id] && !isShadowBanned) {
        const transfer = transfers[id];
        // Check that there isn't a sender yet
        if (transfer.sender !== false) {
          callback(false);
          return;
        }

        // Add socket to transfer
        transfers[id].sender = socket.id;
        transfers[id].lastActivity = (+new Date());

        // Remove transfer the sender had opened
        const senderTransfer = Object.values(transfers).find(e => e.receiver === socket.id);
        if (senderTransfer) {
          delete transfers[senderTransfer];
        }

        // Check if WebRTC unsupported
        if (method !== 'webrtc') {
          transfers[id].method = 'socket';
        }
        io.to(transfers[id].receiver).emit('pair partner found', transfers[id].method);
        callback(true, transfers[id].method);
      } else {
        // Track failed connections
        if (!isShadowBanned) {
          debug(`Putting user in cooldown for ${numFailedConnections / 2} seconds`);
          socketInCooldown = true;
          setTimeout(() => {
            socketInCooldown = false;
          }, numFailedConnections * 500);
          numFailedConnections += 1;

          if (numFailedConnections > 10) {
            debug('Shadow banned user');
            isShadowBanned = true;
          }
        }

        callback(false, '');
      }
    });

    // Receiver is changing transfer method
    socket.on('set transfer method', (method, id) => {
      if (id && transfers[id]) {
        if (transfers[id].receiver !== socket.id) return;

        transfers[id].locked = false;
        transfers[id].lastActivity = (+new Date());
        io.to(transfers[id].sender).emit('set transfer method', method);
      }
    });

    // Locking connection
    // When selecting files on iOS, the browser will close the socket
    // connection after a few seconds. This is why the browser will
    // "lock" the transfer, allowing the iOS device to reconnect
    // after selecting a file
    socket.on('lock transfer', (id) => {
      if (id && transfers[id]) {
        if (transfers[id].sender !== socket.id) return;

        debug('Client locking transfer', id);

        transfers[id].locked = true;
        transfers[id].lastActivity = (+new Date());
      }
    });

    // Reconnect device
    // After selecting an image on iOS, this allows it to reconnect to its
    // current transfer
    socket.on('reconnect', (oldSocketId, id) => {
      if (isShadowBanned) {
        return;
      }

      if (id && transfers[id]) {
        if (oldSocketId !== socket.id) {
          debug('Client reconnecting with different socket id on', id);

          if (transfers[id].sender === oldSocketId) {
            transfers[id].sender = socket.id;
          } else if (transfers[id].receiver === oldSocketId) {
            transfers[id].receiver = socket.id;
          } else {
            return;
          }
        }

        // Unlock transfer
        transfers[id].locked = false;
        transfers[id].lastActivity = (+new Date());
      } else {
        debug('Client trying to reconnect but has same socket id on', id);
      }
    });

    // Inform other device that a file has been selected
    socket.on('selected file', (id) => {
      if (isShadowBanned) {
        return;
      }

      if (id && transfers[id]) {
        if (transfers[id].sender !== socket.id) return;

        transfers[id].locked = false;
        transfers[id].lastActivity = (+new Date());
        io.to(transfers[id].receiver).emit('partner selected file');
      } else {
        debug('Unknown id in selected file');
      }
    });

    // Proxy request to partner - used during file transfer
    socket.on('proxy to partner', (id, data, callback = false) => {
      if (isShadowBanned) {
        return;
      }

      if (id && transfers[id]) {
        let sendTo = transfers[id].receiver;

        if (transfers[id].sender !== socket.id) {
          sendTo = transfers[id].sender;
        }

        io.to(sendTo).emit('proxy to partner', data);

        transfers[id].lastActivity = (+new Date());

        if (callback) {
          callback();
        }
      }
    });

    socket.on('acknowledge rtc data', (id) => {
      if (isShadowBanned) {
        return;
      }

      if (id && transfers[id]) {
        io.to(transfers[id].sender).emit('acknowledge rtc data');

        transfers[id].lastActivity = (+new Date());
      }
    });

    socket.on('acknowledge transfer complete', (id) => {
      if (isShadowBanned) {
        return;
      }

      if (id && transfers[id]) {
        io.to(transfers[id].sender).emit('acknowledge transfer complete');

        transfers[id].lastActivity = (+new Date());
      }
    });

    // Client disconnects - abort transfer if transfer is not locked
    socket.on('disconnect', () => {
      debug('Client disconnected');

      // eslint-disable-next-line no-restricted-syntax
      for (const transfer in transfers) {
        if (transfers[transfer].receiver === socket.id) {
          if (!transfers[transfer].locked) {
          // Inform sender of disconnect
            if (transfers[transfer].sender !== false) {
              io.to(transfers[transfer].sender).emit('partner disconnected');
            }

            delete transfers[transfer];
          } else {
            debug('Client disconnected on', transfer, 'but transfer is locked');
          }
        } else if (transfers[transfer].sender === socket.id) {
          if (!transfers[transfer].locked) {
          // Inform receiver of disconnect
            if (transfers[transfer].receiver !== false) {
              io.to(transfers[transfer].receiver).emit('partner disconnected');
            }

            delete transfers[transfer];
          } else {
            debug('Client disconnected on', transfer, 'but transfer is locked');
          }
        }
      }
    });
  });

  // Garbage collector, remove old/unused ids
  const garbageCollector = () => {
    debug('Garbage collecting...');

    const now = (+new Date());
    const validTime = 1000 * 60 * 60 * 23; // keep transfers valid for 23 hours
    const inactivityTime = 1000 * 60 * 30; // keep transfers valid for 1/2 hour of no activity
    let collected = 0; // Number of transfers deleted

    // eslint-disable-next-line no-restricted-syntax
    for (const key in transfers) {
      if ((transfers[key].created + validTime) < now) {
        // Transfer is invalid due to age
        delete transfers[key];
        collected += 1;
      } else if ((transfers[key].lastActivity + inactivityTime) < now) {
        // Transfer is invalid due to inactivity
        delete transfers[key];
        collected += 1;
      }
    }

    console.log(`Garbage-collected ${collected} entries`);
  };
  // Run garbage collector every 15 minutes
  setInterval(garbageCollector, 1000 * 60 * 15);
};
