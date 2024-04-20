var scene1 = true;
var scene2 = false;


let recognition;
let finalTranscript = '';
let currentImageDisplay = null; // This will hold the reference to the image currently displayed

function preload() {
  originalImage = loadImage('images/originalImage.jpeg');
}

function setup() {
    createCanvas(1920, 1080);
    textFont('Courier New');
  const click_to_record = select('#click_to_record');
  const stop_recording = select('#stop_recording');

  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (window.SpeechRecognition) {
    setupSpeechRecognition();
  } else {
    console.error('Speech Recognition not supported in this browser.');
  }

  click_to_record.mousePressed(startRecording);
  stop_recording.mousePressed(stopAndResetRecording);
}

function draw() {
    if (scene1 == true) {
        fill(0, 255, 0);
        textSize(35);
        image(originalImage, 0, 0);
        text("Describe this image with as much detail as possible", 200, 200);
    }
}

function startRecording() {
  recognition.start();
  console.log("Speech recognition started!");

  setTimeout(() => {
    console.log("30 seconds passed, stopping and resetting recording.");
    stopAndResetRecording();
  }, 15000); // Stop and reset after 30 seconds
}

function stopAndResetRecording() {
  recognition.stop();
  console.log("Speech recognition stopped by user.");
  console.log("Final transcript for this session:", finalTranscript);
  resetTranscription(); // Reset the transcript after stopping
}


function setupSpeechRecognition() {
  recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript; // Append only finalized text to final transcript
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    select('#convert_text').value(finalTranscript + interimTranscript);
  };

  recognition.onend = () => {
      console.log("Recognition ended");
      getImage(finalTranscript)
  };
}

function resetTranscription() {
  finalTranscript = ''; // Clear the final transcript
  select('#convert_text').value(''); // Clear the input/display field
}


async function getImage(transcript) {
  const formData = new FormData();
  formData.append('prompt', transcript);
  formData.append('output_format', 'webp');

  try {
    const response = await axios.post(
      `https://api.stability.ai/v2beta/stable-image/generate/core`,
      formData,
      {
        headers: {
          Authorization: `Bearer sk-2yXYGDUMvDo9rL6TtR41vc6BLgiw5iCKH6DSJa8kAUXMcxxF`,
          Accept: "image/*"
        },
        responseType: "blob"
      }
    );

    if (response.status === 200) {
      console.log("Image saved successfully.");

      // Remove the previous image if there is one
      if (currentImageDisplay) {
        currentImageDisplay.remove();
      }

      // Create a new image and store its reference
      currentImageDisplay = createImg(URL.createObjectURL(response.data), 'generated image');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}