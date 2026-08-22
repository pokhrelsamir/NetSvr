// =========================================================
// NetSvr
// Real-Time Shared Text Editor
// =========================================================

const Editor = {

    elements: {},

    socket: null,

    connected: false,

    saveTimer: null,

    SAVE_DELAY: 400,

    suppressInput: false,

    pollTimer: null,

    pollingFor: null,

    POLL_INTERVAL: 2000,

    ACTIVE_TYPING_WINDOW: 1500,

    roomCode: null,

    lastSentText: null,

    lastInputAt: 0,

    connectionId: 0,


    // =====================================================
    // Initialize
    // =====================================================

    init() {

        this.elements = {

            textArea:
                document.getElementById("sharedText"),

            wordCount:
                document.getElementById("wordCount"),

            charCount:
                document.getElementById("charCount"),

            copyButton:
                document.getElementById("copyTextBtn"),

            clearButton:
                document.getElementById("clearTextBtn"),

            syncStatus:
                document.getElementById("syncStatus")

        };


        this.bindEvents();

        this.restoreLocalText();

        this.updateStats();

    },


    // =====================================================
    // Events
    // =====================================================

    bindEvents() {

        this.elements.textArea?.addEventListener(
            "input",
            () => {

                this.updateStats();

                if (
                    this.suppressInput
                ) {

                    return;

                }


                this.lastInputAt =
                    Date.now();


                this.setStatus(
                    "Typing..."
                );


                this.scheduleSave();


                this.sendText();

            }
        );


        this.elements.copyButton?.addEventListener(
            "click",
            () => {

                this.copyText();

            }
        );


        this.elements.clearButton?.addEventListener(
            "click",
            () => {

                this.clearText();

            }
        );

    },


    // =====================================================
    // Connect WebSocket
    // =====================================================

    connect(roomCode) {

        if (!roomCode) {

            console.warn(
                "Cannot connect without room code."
            );

            return;

        }


        this.disconnect();


        this.connectionId =
            this.connectionId + 1;

        const connectionId =
            this.connectionId;


        this.roomCode =
            roomCode;

        this.lastSentText =
            null;


        const protocol =
            window.location.protocol === "https:"
                ? "wss:"
                : "ws:";


        const host =
            window.location.hostname ===
                "localhost"
                ? `${window.location.hostname}:3000`
                : window.location.host;


        const socketUrl =
            `${protocol}//${host}/ws`;


        console.log(
            "Connecting to:",
            socketUrl
        );


        this.socket =
            new WebSocket(
                socketUrl
            );


        // -------------------------------------------------
        // Connected
        // -------------------------------------------------

        this.socket.addEventListener(
            "open",
            () => {

                if (
                    connectionId !==
                    this.connectionId
                ) {

                    return;

                }


                this.connected =
                    true;


                this.stopPolling();


                this.setStatus(
                    "Connected"
                );


                this.socket.send(
                    JSON.stringify({

                        type:
                            "ROOM_JOIN",

                        roomCode:
                            roomCode

                    })
                );


                console.log(
                    `Connected to room ${roomCode}`
                );

            }
        );


        // -------------------------------------------------
        // Message
        // -------------------------------------------------

        this.socket.addEventListener(
            "message",
            (event) => {

                if (
                    connectionId !==
                    this.connectionId
                ) {

                    return;

                }


                this.handleMessage(
                    event.data
                );

            }
        );


        // -------------------------------------------------
        // Close
        // -------------------------------------------------

        this.socket.addEventListener(
            "close",
            () => {

                if (
                    connectionId !==
                    this.connectionId
                ) {

                    return;

                }


                this.connected =
                    false;


                this.setStatus(
                    "Disconnected"
                );


                this.startPolling(
                    roomCode
                );


                console.log(
                    "WebSocket disconnected."
                );

            }
        );


        // -------------------------------------------------
        // Error
        // -------------------------------------------------

        this.socket.addEventListener(
            "error",
            (error) => {

                if (
                    connectionId !==
                    this.connectionId
                ) {

                    return;

                }


                console.error(
                    "WebSocket error:",
                    error
                );


                this.connected =
                    false;


                this.setStatus(
                    "Connection error"
                );

            }
        );

    },


    // =====================================================
    // Disconnect
    // =====================================================

    disconnect() {

        this.connectionId =
            this.connectionId + 1;


        this.stopPolling();


        this.roomCode =
            null;

        this.lastSentText =
            null;


        if (!this.socket) {

            return;

        }


        try {

            if (
                this.socket.readyState ===
                WebSocket.OPEN
            ) {

                this.socket.send(
                    JSON.stringify({

                        type:
                            "ROOM_LEAVE"

                    })
                );

            }


            this.socket.close();

        } catch (error) {

            console.error(
                "Disconnect error:",
                error
            );

        }


        this.socket =
            null;

        this.connected =
            false;

    },


    // =====================================================
    // Handle Server Message
    // =====================================================

    handleMessage(rawMessage) {

        let message;


        try {

            message =
                JSON.parse(
                    rawMessage
                );

        } catch (error) {

            console.error(
                "Invalid WebSocket message:",
                error
            );

            return;

        }


        switch (
            message.type
        ) {

            case "ROOM_JOINED":

                this.handleRoomJoined(
                    message
                );

                break;


            case "TEXT_UPDATE":

                this.receiveText(
                    message.text
                );

                break;


            case "TEXT_SAVED":

                this.setStatus(
                    "Saved"
                );

                break;


            case "USER_COUNT":

                this.updateUserCount(
                    message.count
                );

                break;


            case "ROOM_LEFT":

                this.setStatus(
                    "Disconnected"
                );

                break;


            case "ROOM_ERROR":

                this.setStatus(
                    "Room error"
                );

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.showToast(
                        message.message
                    );

                }

                break;


            case "ERROR":

                console.error(
                    "Server error:",
                    message.message
                );

                break;


            case "PONG":

                break;


            default:

                console.warn(
                    "Unknown WebSocket message:",
                    message
                );

        }

    },


    // =====================================================
    // Room Joined
    // =====================================================

    handleRoomJoined(message) {

        if (
            message.room
        ) {

            this.suppressInput =
                true;


            this.setText(
                message.room.text || ""
            );


            this.suppressInput =
                false;


            this.updateStats();

        }


        this.setStatus(
            "Connected"
        );


        this.updateUserCount(
            message.room?.clients || 1
        );

    },


    // =====================================================
    // Send Text
    // =====================================================

    sendText() {

        const text =
            this.getText();


        this.lastSentText =
            text;


        if (
            !this.socket ||
            this.socket.readyState !==
                WebSocket.OPEN
        ) {

            this.sendTextRest(
                text
            );

            this.saveLocalText();

            return;

        }


        this.socket.send(
            JSON.stringify({

                type:
                    "TEXT_UPDATE",

                text

            })
        );


        this.saveLocalText();

    },


    // =====================================================
    // Send Text via REST (Polling Fallback)
    // =====================================================

    async sendTextRest(text) {

        if (!this.roomCode) {

            return;

        }


        try {

            const response =
                await fetch(

                    `/api/rooms/${encodeURIComponent(this.roomCode)}`,

                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                text
                            })
                    }

                );


            if (response.ok) {

                this.setStatus(
                    "Saved"
                );

            } else if (
                response.status === 404
            ) {

                this.setStatus(
                    "Room expired"
                );

            }

        } catch (error) {

            console.error(
                "REST text sync failed:",
                error
            );

        }

    },


    // =====================================================
    // Polling Fallback
    // =====================================================

    startPolling(roomCode) {

        if (!roomCode || !this.roomCode) {

            return;

        }


        if (
            this.pollTimer &&
            this.pollingFor === roomCode
        ) {

            return;

        }


        this.stopPolling();


        this.pollingFor =
            roomCode;


        this.pollTimer =
            setInterval(
                () => {

                    this.pollRoom();

                },
                this.POLL_INTERVAL
            );


        console.log(
            `WebSocket unavailable — polling /api/rooms/${roomCode}`
        );

    },


    stopPolling() {

        if (
            this.pollTimer
        ) {

            clearInterval(
                this.pollTimer
            );

            this.pollTimer =
                null;

        }


        this.pollingFor =
            null;

    },


    async pollRoom() {

        if (
            !this.roomCode ||
            !this.pollingFor
        ) {

            return;

        }


        /*
         * Don't clobber the textarea while
         * the local user is actively typing.
         */

        if (
            Date.now() - this.lastInputAt <
                this.ACTIVE_TYPING_WINDOW
        ) {

            return;

        }


        try {

            const response =
                await fetch(
                    `/api/rooms/${encodeURIComponent(this.roomCode)}`
                );


            if (!response.ok) {

                return;

            }


            const data =
                await response.json();


            if (
                !data.success ||
                !data.room
            ) {

                return;

            }


            const remoteText =
                data.room.text || "";


            if (
                remoteText !== this.getText()
            ) {

                this.receiveText(
                    remoteText
                );

            }

        } catch (error) {

            /* Transient network errors are ignored. */

        }

    },


    // =====================================================
    // Receive Text
    // =====================================================

    receiveText(text) {

        this.suppressInput =
            true;


        this.setText(
            text
        );


        this.suppressInput =
            false;


        this.updateStats();

        this.saveLocalText();

        this.setStatus(
            "Synced"
        );

    },


    // =====================================================
    // Restore Local Text
    // =====================================================

    restoreLocalText() {

        if (
            typeof Room === "undefined"
        ) {

            return;

        }


        const room =
            Room.getSavedRoom();


        if (!room) {

            return;

        }


        this.setText(
            room.text || ""
        );

    },


    // =====================================================
    // Save Local Backup
    // =====================================================

    saveLocalText() {

        if (
            typeof Room === "undefined"
        ) {

            return;

        }


        const room =
            Room.getSavedRoom();


        if (!room) {

            return;

        }


        room.text =
            this.getText();


        Room.saveRoom(
            room
        );

    },


    // =====================================================
    // Schedule Local Save
    // =====================================================

    scheduleSave() {

        clearTimeout(
            this.saveTimer
        );


        this.saveTimer =
            setTimeout(
                () => {

                    this.saveLocalText();

                },
                this.SAVE_DELAY
            );

    },


    // =====================================================
    // Get Text
    // =====================================================

    getText() {

        return (
            this.elements.textArea?.value ||
            ""
        );

    },


    // =====================================================
    // Set Text
    // =====================================================

    setText(text) {

        if (
            !this.elements.textArea
        ) {

            return;

        }


        this.elements.textArea.value =
            text || "";

    },


    // =====================================================
    // Statistics
    // =====================================================

    updateStats() {

        const text =
            this.getText();


        const characters =
            text.length;


        const trimmed =
            text.trim();


        const words =
            trimmed
                ? trimmed.split(/\s+/).length
                : 0;


        if (
            this.elements.charCount
        ) {

            this.elements.charCount.textContent =
                characters;

        }


        if (
            this.elements.wordCount
        ) {

            this.elements.wordCount.textContent =
                words;

        }

    },


    // =====================================================
    // Copy
    // =====================================================

    async copyText() {

        const text =
            this.getText();


        if (!text) {

            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "There is no text to copy."
                );

            }

            return;

        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "Text copied!"
                );

            }

        } catch (error) {

            console.error(
                "Copy failed:",
                error
            );

        }

    },


    // =====================================================
    // Clear
    // =====================================================

    clearText() {

        if (
            !this.getText()
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                "Clear all shared text?"
            );


        if (!confirmed) {

            return;

        }


        this.setText(
            ""
        );


        this.updateStats();

        this.sendText();

        this.saveLocalText();


        if (
            typeof UI !== "undefined"
        ) {

            UI.showToast(
                "Shared text cleared."
            );

        }

    },


    // =====================================================
    // User Count
    // =====================================================

    updateUserCount(count) {

        const element =
            document.getElementById(
                "deviceCount"
            );


        if (!element) {

            return;

        }


        element.textContent =
            `${count} ${
                count === 1
                    ? "device"
                    : "devices"
            } connected`;

    },


    // =====================================================
    // Status
    // =====================================================

    setStatus(status) {

        if (
            !this.elements.syncStatus
        ) {

            return;

        }


        this.elements.syncStatus.textContent =
            `● ${status}`;

    }

};


// =========================================================
// Initialize
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Editor.init();

    }
);