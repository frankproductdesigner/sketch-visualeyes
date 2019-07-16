import sketch from "sketch";

export default function() {
  return new Promise((resolve, reject) => {
    const apiKey = sketch.Settings.settingForKey("api-key");
    let message = "";
    if (apiKey) {
      message = `\nYou current API key is: ${apiKey}`;
    }
    sketch.UI.getInputFromUser(
      "Asight API Key",
      {
        description: `You can find your API key on Link.${message}`,
        okButton: "Save API Key"
      },
      (err, value) => {
        if (err) {
          return reject(err);
        }
        sketch.Settings.setSettingForKey("api-key", value);
        return resolve(value);
      }
    );
  });
}
