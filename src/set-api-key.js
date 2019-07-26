import sketch from "sketch";

export default function() {
  return new Promise((resolve, reject) => {
    const apiKey = sketch.Settings.settingForKey("api-key");
    let description = "";
    if (apiKey) {
      description = `Change your API key on our website https://visualeyes.loceye.io.\n\nYou current API key is: ${apiKey}`;
    }
    else {
      description = 'Find your API key on our website https://visualeyes.loceye.io.'
    }
    sketch.UI.getInputFromUser(
      "Asight API Key",
      {
        description,
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
