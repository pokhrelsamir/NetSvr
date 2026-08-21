// =========================================================
// NetSvr
// QR Code Manager
// =========================================================

const QR = {

    /* -----------------------------------------------------
       Configuration
    ----------------------------------------------------- */

    size: 220,

    /* -----------------------------------------------------
       Initialize
    ----------------------------------------------------- */

    init() {

        this.bindEvents();

    },


    /* -----------------------------------------------------
       Bind Events
    ----------------------------------------------------- */

    bindEvents() {

        const downloadButton =
            document.getElementById(
                "downloadQrBtn"
            );

        downloadButton?.addEventListener(
            "click",
            () => this.download()
        );

    },


    /* -----------------------------------------------------
       Generate QR
    ----------------------------------------------------- */

    generate() {

        const container =
            document.getElementById(
                "qrCode"
            );

        if (!container) {

            return;

        }


        const roomCode =
            document.getElementById(
                "roomCodeDisplay"
            )?.textContent.trim();


        if (!roomCode) {

            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "No active room."
                );

            }

            return;

        }


        const roomUrl =
            `${window.location.origin}/room/${roomCode}`;


        container.innerHTML = "";


        /*
         * Use a QR image service for the
         * frontend prototype.
         *
         * In production we can replace this
         * with a local QR library so no
         * external request is required.
         */

        const image =
            document.createElement(
                "img"
            );


        image.src =
            `https://api.qrserver.com/v1/create-qr-code/?size=${this.size}x${this.size}&data=${encodeURIComponent(roomUrl)}`;


        image.alt =
            `QR code for NetSvr room ${roomCode}`;


        image.width =
            this.size;


        image.height =
            this.size;


        image.loading =
            "eager";


        image.className =
            "generated-qr";


        image.addEventListener(
            "error",
            () => {

                container.innerHTML = `
                    <div class="qr-error">
                        Unable to generate QR code.
                    </div>
                `;

            }
        );


        container.appendChild(
            image
        );


        this.currentUrl =
            roomUrl;

    },


    /* -----------------------------------------------------
       Download QR
    ----------------------------------------------------- */

    async download() {

        if (!this.currentUrl) {

            this.generate();

        }


        if (!this.currentUrl) {

            return;

        }


        const roomCode =
            document.getElementById(
                "roomCodeDisplay"
            )?.textContent.trim() ||
            "room";


        const imageUrl =
            `https://api.qrserver.com/v1/create-qr-code/?size=800x800&format=png&data=${encodeURIComponent(this.currentUrl)}`;


        try {

            const response =
                await fetch(
                    imageUrl
                );


            if (!response.ok) {

                throw new Error(
                    "QR download failed"
                );

            }


            const blob =
                await response.blob();


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                `netsvr-${roomCode}-qr.png`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "QR code downloaded."
                );

            }

        } catch (error) {

            console.error(
                error
            );


            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "Unable to download QR code."
                );

            }

        }

    }

};


/* =========================================================
   Initialize
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        QR.init();

    }
);