// =========================================================
// NetSvr
// File Manager
// =========================================================

const Files = {

    elements: {},

    files: [],


    /* -----------------------------------------------------
       Initialize
    ----------------------------------------------------- */

    init() {

        this.elements = {

            dropZone:
                document.getElementById("dropZone"),

            fileInput:
                document.getElementById("fileInput"),

            browseButton:
                document.getElementById("browseFilesBtn"),

            fileList:
                document.getElementById("fileList"),

            fileCount:
                document.getElementById("fileCount")

        };


        this.bindEvents();

        this.render();

    },


    /* -----------------------------------------------------
       Event Listeners
    ----------------------------------------------------- */

    bindEvents() {

        this.elements.browseButton?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                this.elements.fileInput?.click();

            }
        );


        this.elements.dropZone?.addEventListener(
            "click",
            () => {

                this.elements.fileInput?.click();

            }
        );


        this.elements.fileInput?.addEventListener(
            "change",
            (event) => {

                this.handleFiles(
                    event.target.files
                );

                event.target.value = "";

            }
        );


        this.elements.dropZone?.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                this.elements.dropZone.classList.add(
                    "drag-over"
                );

            }
        );


        this.elements.dropZone?.addEventListener(
            "dragleave",
            () => {

                this.elements.dropZone.classList.remove(
                    "drag-over"
                );

            }
        );


        this.elements.dropZone?.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                this.elements.dropZone.classList.remove(
                    "drag-over"
                );


                this.handleFiles(
                    event.dataTransfer.files
                );

            }
        );

    },


    /* -----------------------------------------------------
       Handle Files
    ----------------------------------------------------- */

    handleFiles(fileList) {

        if (!fileList || !fileList.length) {

            return;

        }


        const selectedFiles =
            Array.from(fileList);


        selectedFiles.forEach(
            (file) => {

                this.addFile(
                    file
                );

            }
        );


        this.render();


        if (
            typeof UI !== "undefined"
        ) {

            const count =
                selectedFiles.length;


            UI.showToast(
                `${count} ${
                    count === 1
                        ? "file"
                        : "files"
                } added.`
            );

        }

    },


    /* -----------------------------------------------------
       Add File
    ----------------------------------------------------- */

    addFile(file) {

        const id =
            this.generateFileId();


        const fileData = {

            id,

            name:
                file.name,

            size:
                file.size,

            type:
                file.type ||
                "application/octet-stream",

            file,

            addedAt:
                Date.now()

        };


        this.files.push(
            fileData
        );

    },


    /* -----------------------------------------------------
       Generate File ID
    ----------------------------------------------------- */

    generateFileId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );

    },


    /* -----------------------------------------------------
       Remove File
    ----------------------------------------------------- */

    removeFile(id) {

        const index =
            this.files.findIndex(
                (file) =>
                    file.id === id
            );


        if (index === -1) {

            return;

        }


        this.files.splice(
            index,
            1
        );


        this.render();


        if (
            typeof UI !== "undefined"
        ) {

            UI.showToast(
                "File removed."
            );

        }

    },


    /* -----------------------------------------------------
       Download File
    ----------------------------------------------------- */

    downloadFile(id) {

        const fileData =
            this.files.find(
                (file) =>
                    file.id === id
            );


        if (!fileData) {

            return;

        }


        const url =
            URL.createObjectURL(
                fileData.file
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.download =
            fileData.name;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        if (
            typeof UI !== "undefined"
        ) {

            UI.showToast(
                "Download started."
            );

        }

    },


    /* -----------------------------------------------------
       Render File List
    ----------------------------------------------------- */

    render() {

        const container =
            this.elements.fileList;


        if (!container) {

            return;

        }


        if (!this.files.length) {

            container.innerHTML = `
                <div class="empty-files">
                    No files shared yet.
                </div>
            `;


            this.updateCount();

            return;

        }


        container.innerHTML =
            this.files
                .map(
                    (file) =>
                        this.createFileHTML(
                            file
                        )
                )
                .join("");


        this.bindFileActions();

        this.updateCount();

    },


    /* -----------------------------------------------------
       Create File HTML
    ----------------------------------------------------- */

    createFileHTML(file) {

        const icon =
            this.getFileIcon(
                file.type,
                file.name
            );


        return `
            <div
                class="file-item"
                data-file-id="${file.id}"
            >

                <div class="file-icon">
                    ${icon}
                </div>

                <div class="file-info">

                    <div
                        class="file-name"
                        title="${this.escapeHTML(file.name)}"
                    >
                        ${this.escapeHTML(file.name)}
                    </div>

                    <div class="file-size">
                        ${this.formatSize(file.size)}
                    </div>

                </div>

                <div class="file-actions">

                    <button
                        class="file-action download-file"
                        data-id="${file.id}"
                        title="Download"
                    >
                        ↓
                    </button>

                    <button
                        class="file-action remove-file"
                        data-id="${file.id}"
                        title="Remove"
                    >
                        ×
                    </button>

                </div>

            </div>
        `;

    },


    /* -----------------------------------------------------
       Bind File Actions
    ----------------------------------------------------- */

    bindFileActions() {

        document
            .querySelectorAll(".download-file")
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        (event) => {

                            event.stopPropagation();

                            this.downloadFile(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(".remove-file")
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        (event) => {

                            event.stopPropagation();

                            this.removeFile(
                                button.dataset.id
                            );

                        }
                    );

                }
            );

    },


    /* -----------------------------------------------------
       Update File Count
    ----------------------------------------------------- */

    updateCount() {

        if (!this.elements.fileCount) {

            return;

        }


        const count =
            this.files.length;


        this.elements.fileCount.textContent =
            `${count} ${
                count === 1
                    ? "file"
                    : "files"
            }`;

    },


    /* -----------------------------------------------------
       File Icon
    ----------------------------------------------------- */

    getFileIcon(type, name) {

        const extension =
            name
                .split(".")
                .pop()
                .toLowerCase();


        if (
            type.startsWith("image/")
        ) {

            return "🖼️";

        }


        if (
            type.startsWith("video/")
        ) {

            return "🎬";

        }


        if (
            type.startsWith("audio/")
        ) {

            return "🎵";

        }


        if (
            type === "application/pdf" ||
            extension === "pdf"
        ) {

            return "📕";

        }


        if (
            [
                "zip",
                "rar",
                "7z",
                "tar",
                "gz"
            ].includes(extension)
        ) {

            return "📦";

        }


        if (
            [
                "js",
                "ts",
                "jsx",
                "tsx",
                "html",
                "css",
                "py",
                "java",
                "c",
                "cpp",
                "json"
            ].includes(extension)
        ) {

            return "💻";

        }


        if (
            [
                "doc",
                "docx"
            ].includes(extension)
        ) {

            return "📘";

        }


        if (
            [
                "xls",
                "xlsx",
                "csv"
            ].includes(extension)
        ) {

            return "📊";

        }


        if (
            [
                "ppt",
                "pptx"
            ].includes(extension)
        ) {

            return "📙";

        }


        if (
            [
                "txt",
                "md",
                "log"
            ].includes(extension)
        ) {

            return "📝";

        }


        return "📄";

    },


    /* -----------------------------------------------------
       Format File Size
    ----------------------------------------------------- */

    formatSize(bytes) {

        if (
            bytes === 0
        ) {

            return "0 Bytes";

        }


        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];


        const index =
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            );


        const size =
            bytes /
            Math.pow(
                1024,
                index
            );


        return `${size.toFixed(
            index === 0 ? 0 : 2
        )} ${units[index]}`;

    },


    /* -----------------------------------------------------
       Escape HTML
    ----------------------------------------------------- */

    escapeHTML(value) {

        const element =
            document.createElement(
                "div"
            );


        element.textContent =
            value;


        return element.innerHTML;

    }

};


/* =========================================================
   Initialize
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Files.init();

    }
);