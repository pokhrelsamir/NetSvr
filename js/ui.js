// =========================================================
// NetSvr
// UI Controller
// =========================================================

const UI = {

    /* -----------------------------------------------------
       Elements
    ----------------------------------------------------- */

    elements: {},


    /* -----------------------------------------------------
       Initialize
    ----------------------------------------------------- */

    init() {

        this.elements = {

            landingSection:
                document.getElementById("landingSection"),

            roomSection:
                document.getElementById("roomSection"),

            createRoomBtn:
                document.getElementById("createRoomBtn"),

            showJoinBtn:
                document.getElementById("showJoinBtn"),

            joinBox:
                document.getElementById("joinBox"),

            joinRoomBtn:
                document.getElementById("joinRoomBtn"),

            roomCodeInput:
                document.getElementById("roomCodeInput"),

            roomError:
                document.getElementById("roomError"),

            leaveRoomBtn:
                document.getElementById("leaveRoomBtn"),

            copyRoomBtn:
                document.getElementById("copyRoomBtn"),

            shareRoomBtn:
                document.getElementById("shareRoomBtn"),

            showQrBtn:
                document.getElementById("showQrBtn"),

            closeQrBtn:
                document.getElementById("closeQrBtn"),

            qrModal:
                document.getElementById("qrModal"),

            toast:
                document.getElementById("toast"),

            toastMessage:
                document.getElementById("toastMessage"),

            connectionStatus:
                document.getElementById("connectionStatus")
        };

        this.bindEvents();

    },


    /* -----------------------------------------------------
       Event Listeners
    ----------------------------------------------------- */

    bindEvents() {

        this.elements.showJoinBtn?.addEventListener(
            "click",
            () => this.showJoinBox()
        );


        this.elements.createRoomBtn?.addEventListener(
            "click",
            async () => {

                if (typeof Room === "undefined") {

                    return;

                }

                try {

                    this.setConnectionStatus(
                        "Creating room..."
                    );

                    const room =
                        await Room.create();

                    this.enterRoom(
                        room
                    );

                    this.showToast(
                        `Room ${room.code} created!`
                    );

                } catch (error) {

                    console.error(
                        "Create room failed:",
                        error
                    );

                    this.setConnectionStatus(
                        "Ready"
                    );

                    this.showToast(
                        "Unable to create room."
                    );

                }

            }
        );


        this.elements.joinRoomBtn?.addEventListener(
            "click",
            () => this.handleJoin()
        );


        this.elements.roomCodeInput?.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    this.handleJoin();

                }

            }
        );


        this.elements.leaveRoomBtn?.addEventListener(
            "click",
            () => this.leaveRoom()
        );


        this.elements.copyRoomBtn?.addEventListener(
            "click",
            () => this.copyRoomLink()
        );


        this.elements.shareRoomBtn?.addEventListener(
            "click",
            () => this.shareRoom()
        );


        this.elements.showQrBtn?.addEventListener(
            "click",
            () => this.openQR()
        );


        this.elements.closeQrBtn?.addEventListener(
            "click",
            () => this.closeQR()
        );


        this.elements.qrModal?.querySelector(
            ".modal-overlay"
        )?.addEventListener(
            "click",
            () => this.closeQR()
        );


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape" &&
                    !this.elements.qrModal?.classList.contains("hidden")
                ) {

                    this.closeQR();

                }

            }
        );

    },


    /* -----------------------------------------------------
       Show Join Box
    ----------------------------------------------------- */

    showJoinBox() {

        this.elements.joinBox?.classList.remove(
            "hidden"
        );

        this.elements.roomCodeInput?.focus();

    },


    /* -----------------------------------------------------
       Handle Join
    ----------------------------------------------------- */

    handleJoin() {

        const input =
            this.elements.roomCodeInput;

        const code =
            input?.value.trim().toUpperCase();


        if (!code || code.length < 4) {

            this.showRoomError(
                "Please enter a valid room code."
            );

            return;

        }


        if (typeof Room === "undefined") {

            return;

        }


        this.hideRoomError();

        this.setConnectionStatus(
            "Joining room..."
        );


        Room.join(code)

            .then((room) => {

                this.enterRoom(
                    room
                );

                this.showToast(
                    `Joined room ${room.code}.`
                );

            })

            .catch((error) => {

                console.error(
                    "Join room failed:",
                    error
                );

                this.setConnectionStatus(
                    "Ready"
                );

                this.showRoomError(
                    error.message ||
                        "Unable to join room."
                );

            });

    },


    /* -----------------------------------------------------
       Room Error
    ----------------------------------------------------- */

    showRoomError(message) {

        const error =
            this.elements.roomError;

        if (!error) return;

        error.textContent = message;

        error.classList.remove(
            "hidden"
        );

    },


    hideRoomError() {

        this.elements.roomError?.classList.add(
            "hidden"
        );

    },


    /* -----------------------------------------------------
       Enter Room
       ----------------------------------------------------- */

    enterRoom(room) {

        if (!room || !room.code) {

            return;

        }


        this.hideRoomError();

        this.showRoom(
            room.code
        );


        if (
            typeof Room !== "undefined"
        ) {

            Room.startExpirationTimer(
                room.expiresAt,
                () => this.handleRoomExpired()
            );

        }


        if (
            typeof Editor !== "undefined" &&
            typeof Editor.connect === "function"
        ) {

            Editor.connect(
                room.code
            );

        }

    },


    /* -----------------------------------------------------
       Handle Room Expired
       ----------------------------------------------------- */

    handleRoomExpired() {

        if (
            typeof Editor !== "undefined" &&
            typeof Editor.disconnect === "function"
        ) {

            Editor.disconnect();

        }


        this.elements.roomSection?.classList.add(
            "hidden"
        );

        this.elements.landingSection?.classList.remove(
            "hidden"
        );

        this.setConnectionStatus(
            "Ready"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        this.showToast(
            "This room has expired."
        );

    },


    /* -----------------------------------------------------
       Show Room
    ----------------------------------------------------- */

    showRoom(roomCode) {

        this.elements.landingSection?.classList.add(
            "hidden"
        );

        this.elements.roomSection?.classList.remove(
            "hidden"
        );


        const display =
            document.getElementById(
                "roomCodeDisplay"
            );

        const urlDisplay =
            document.getElementById(
                "roomUrlDisplay"
            );

        const qrCode =
            document.getElementById(
                "qrRoomCode"
            );


        if (display) {

            display.textContent =
                roomCode;

        }


        if (urlDisplay) {

            urlDisplay.textContent =
                `${window.location.origin}/room/${roomCode}`;

        }


        if (qrCode) {

            qrCode.textContent =
                roomCode;

        }


        this.setConnectionStatus(
            "Connected"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    },


    /* -----------------------------------------------------
       Leave Room
    ----------------------------------------------------- */

    leaveRoom() {

        const confirmed =
            window.confirm(
                "Leave this sharing room?"
            );


        if (!confirmed) return;


        if (
            typeof Editor !== "undefined" &&
            typeof Editor.disconnect === "function"
        ) {

            Editor.disconnect();

        }


        if (
            typeof Room !== "undefined"
        ) {

            Room.clear();

        }


        this.elements.roomSection?.classList.add(
            "hidden"
        );

        this.elements.landingSection?.classList.remove(
            "hidden"
        );


        if (this.elements.roomCodeInput) {

            this.elements.roomCodeInput.value = "";

        }


        this.setConnectionStatus(
            "Ready"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        this.showToast(
            "You left the room."
        );

    },


    /* -----------------------------------------------------
       Get Active Room URL
       ----------------------------------------------------- */

    getActiveRoomURL() {

        const roomCode =
            document.getElementById(
                "roomCodeDisplay"
            )?.textContent.trim();


        if (
            !roomCode ||
            roomCode === "-----"
        ) {

            return null;

        }


        if (
            typeof Room !== "undefined" &&
            typeof Room.getRoomURL === "function"
        ) {

            return Room.getRoomURL(
                roomCode
            );

        }


        return (
            `${window.location.origin}/room/${roomCode}`
        );

    },


    /* -----------------------------------------------------
       Copy Room Link
       ----------------------------------------------------- */

    async copyRoomLink() {

        const url =
            this.getActiveRoomURL();


        if (!url) {

            this.showToast(
                "Create or join a room first."
            );

            return;

        }


        try {

            await navigator.clipboard.writeText(
                url
            );

            this.showToast(
                "Room link copied!"
            );

        } catch (error) {

            this.showToast(
                "Unable to copy room link."
            );

        }

    },


    /* -----------------------------------------------------
       Share Room
    ----------------------------------------------------- */

    async shareRoom() {

        const roomCode =
            document.getElementById(
                "roomCodeDisplay"
            )?.textContent.trim();


        const url =
            this.getActiveRoomURL();


        if (!url) {

            this.showToast(
                "Create or join a room first."
            );

            return;

        }


        if (
            navigator.share
        ) {

            try {

                await navigator.share({

                    title: "Join my NetSvr room",

                    text:
                        `Join my NetSvr sharing room: ${roomCode}`,

                    url

                });

                return;

            } catch (error) {

                if (
                    error.name === "AbortError"
                ) {

                    return;

                }

            }

        }


        try {

            await navigator.clipboard.writeText(
                url
            );

            this.showToast(
                "Room link copied!"
            );

        } catch (error) {

            this.showToast(
                "Unable to share room."
            );

        }

    },


    /* -----------------------------------------------------
       Open QR Modal
    ----------------------------------------------------- */

    openQR() {

        this.elements.qrModal?.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";


        if (
            typeof QR !== "undefined" &&
            typeof QR.generate === "function"
        ) {

            QR.generate();

        }

    },


    /* -----------------------------------------------------
       Close QR Modal
    ----------------------------------------------------- */

    closeQR() {

        this.elements.qrModal?.classList.add(
            "hidden"
        );

        document.body.style.overflow =
            "";

    },


    /* -----------------------------------------------------
       Connection Status
    ----------------------------------------------------- */

    setConnectionStatus(status) {

        if (
            this.elements.connectionStatus
        ) {

            this.elements.connectionStatus.textContent =
                status;

        }

    },


    /* -----------------------------------------------------
       Toast
    ----------------------------------------------------- */

    showToast(message, duration = 2500) {

        const toast =
            this.elements.toast;

        const toastMessage =
            this.elements.toastMessage;


        if (!toast || !toastMessage) {
            return;
        }


        toastMessage.textContent =
            message;


        toast.classList.remove(
            "hidden"
        );


        clearTimeout(
            this.toastTimer
        );


        this.toastTimer =
            setTimeout(
                () => {

                    toast.classList.add(
                        "hidden"
                    );

                },
                duration
            );

    }

};


/* =========================================================
   Initialize UI
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        UI.init();

    }
);