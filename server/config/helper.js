module.exports = {
    /**
     * Normalize a port into a number, string, or false.
     *
     * @param val
     * @returns {*}
     */
    normalizePort          : (val) => {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    },

    /**
     * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
     * images to fit into a certain area.
     *
     * @param {Number} srcWidth Source area width
     * @param {Number} srcHeight Source area height
     * @param {Number} maxWidth Fittable area maximum available width
     * @param {Number} maxHeight Fittable area maximum available height
     * @return {Object} { width, heigth }
     *
     */
    calculateAspectRatioFit: (srcWidth, srcHeight, maxWidth, maxHeight) => {

        let ratio = [maxWidth / srcWidth, maxHeight / srcHeight];
        ratio     = Math.min(ratio[0], ratio[1]);

        return {width: srcWidth * ratio, height: srcHeight * ratio};
    }

}

