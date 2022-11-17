const ejs = require('ejs');

module.exports = function renderFile(fileName, data = {}) {
    return new Promise((resolve, reject) => {
        ejs.renderFile(`templates/${fileName}.html`, data, {}, (error, string) => {
            if (error) {
                reject(error);
            } else {
                resolve(string);
            }
        });
    });
}