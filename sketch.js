let originalImage;
let recognition;
let finalTranscript = '';
let currentGeneratedImage = null;
let scene = 1;
let button;

function preload() {
  originalImage = loadImage('images/originalImage.jpeg');
}

function setup() {
  createCanvas(1920, 1080);
  textFont('Helvetica');
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

  // Create the button in scene 1
  button = createButton('Click me');
  button.position(width / 2, 200);
  button.mousePressed(switchToScene2); // Call switchToScene2 function when the button is pressed
}

function draw() {
  background(255); // Clear the background

  if (scene === 1) {
    drawScene1();
  } else if (scene === 2) {
    drawScene2();
  } else if (scene === 3) {
    drawScene3();
  }
}

function drawScene1() {
  textSize(35);
  textAlign(CENTER);
  text("Press the button to start", width / 2, 100);
  select('#click_to_record').hide();
  select('#stop_recording').hide();
  select('#convert_text').hide();
}

function drawScene2() {
  image(originalImage, 400, 200);
  fill(0);
  textSize(35);
  textAlign(CENTER);
  text("Describe this image with as much detail as possible", width / 2, 100);
  select('#click_to_record').show();
  select('#stop_recording').show();
  select('#convert_text').show();
}

function drawScene3() {
  if (currentGeneratedImage) {
    image(currentGeneratedImage, 0, 0); // Display the generated image
  }
}

function switchToScene2() {
  scene = 2; // Switch to scene 2
  button.remove(); // Remove the button from scene 1
}

function startRecording() {
  recognition.start();
  console.log("Speech recognition started!");

  setTimeout(() => {
    console.log("30 seconds passed, stopping and resetting recording.");
    stopAndResetRecording();
  }, 30000); // Stop and reset after 30 seconds
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
    getImage(finalTranscript);
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

      // Load the generated image
      loadImage(URL.createObjectURL(response.data), img => {
        currentGeneratedImage = img;
        // Switch to the third scene
        scene = 3;
      });
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}
