import sketch, { UI } from "sketch";
import setApiKey from "./set-api-key";
import { Image, Document } from "sketch/dom";

function getApiKey() {
  // Check if user's api Key is stored
  // https://developer.sketch.com/reference/api/#set-a-plugin-setting
  const apiKey = sketch.Settings.settingForKey("api-key");

  if (!apiKey) {
    // If the user do not have an API key, then we should create and save one
    try {
      return setApiKey();
    } catch (e) {}
  } else {
    // The user's api key is saved, now we can resolve the promise
    return Promise.resolve(apiKey);
  }
}

export default function() {
  const document = sketch.getSelectedDocument();
  if (!document) {
    return;
  }
  const selection = document.selectedLayers;

  // Detect if the selection is an artboard or not
  if (selection.lenght === 0) {
    UI.message("You did not select anything 😳");
  } else {
    // Get the Highest Level Selection
    // Should be an artboard
    const artboardLayer = selection.layers[0];

    if (artboardLayer.type !== "Artboard") {
      UI.message("Please select an Αrtboard 🤓");
    } else {
      getApiKey().then((apiKey) => {
        if (!apiKey) {
          sketch.UI.message("Please enter your Asight API key first");
          return;
        }
        UI.message("🧠 Waiting for the prediction of the future...");

        // Set up the Artboard options for the temporary export
        // NSTemporatyDirectory is a Cocoa Function
        // https://developer.apple.com/documentation/foundation/1409211-nstemporarydirectory
        const artboardID = artboardLayer.id;
        const exportPath = NSTemporaryDirectory() + `Asight/Heatmaps/`;
        const options = {
          formats: "jpg",
          output: exportPath,
          compression: 0.7,
          "use-id-for-name": true,
        };

        // Save the image temporary
        sketch.export(artboardLayer, options);
        const url = NSURL.fileURLWithPath(
            exportPath + "/" + artboardID + ".jpg"
          ),
          bitmap = NSData.alloc().initWithContentsOfURL(url),
          base64 = bitmap.base64EncodedStringWithOptions(0);

        // // Remove the image from the temp folder
        NSFileManager.defaultManager().removeItemAtURL_error(url, nil);

        // Now I have the Artboard as a base64 file and I can send it to our API
        const formData = new FormData();
        // Uncomment to send the bitmap instead of the Base64 string
        // formData.append("image_file", {
        //   fileName: artboardID + ".jpg",
        //   mimeType: "image/jpg",
        //   data: bitmap
        // });
        formData.append("isTransparent", "true");
        formData.append("image", "data:image/png;base64," + base64 + "");

        const apiURL = "http://localhost:8000/predict/";
        fetch(apiURL, {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((json) => {
            console.log(json);
            if (json.code !== "success") {
              throw new Error("Error during fetching the heatmap");
            }
            const imgURL = "http://" + json.url;

            const nsURL = NSURL.alloc().initWithString(imgURL);
            const nsimage = NSImage.alloc().initByReferencingURL(nsURL);

            return nsimage;
          })
          .then((nsimage) => {
            const x = 0;
            const y = 0;
            const { width, height } = artboardLayer.frame;
            const rect = new sketch.Rectangle(x, y, width, height);

            const { name } = artboardLayer;

            const shape = new sketch.ShapePath({
              name: `Heatmap of "${name}" Artboard`,
              frame: rect,
              style: {
                fills: [
                  {
                    fill: "Pattern",
                    pattern: {
                      patternType: sketch.Style.PatternFillType.Fill,
                      image: nsimage,
                    },
                  },
                ],
              },
              parent: artboardLayer,
            });
            sketch.UI.message("Enjoy your attention heatmap! 🔥");
          })
          .catch((err) => {
            sketch.UI.message("Sorry but something went wrong! 😭");
            console.log(`[Error]: ${JSON.stringify(err)}`);
          });
      });
    }
  }
}
