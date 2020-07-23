const page = document.querySelector("#page");
const getVisibilityDataFromIframe = document.querySelector(
  "#get-data-from-iframe"
);
const getVisibilityDataFromPage = document.querySelector("#get-data-from-page");
const toggleTargetOpacity = document.querySelector("#toggle-target-opacity");
const getTargetPosition = document.querySelector("#get-target-position");
let io = null;
let opacity = 1;
let target = null;
let ioData = null;
let stepIndex = 1;
let isDataExtractedFromChildIframe = false;

const stepsBtns = {
  1: [getVisibilityDataFromIframe, getVisibilityDataFromPage],
  2: [toggleTargetOpacity, getTargetPosition],
};

const displayIOData = (data) => {
  let ioLog = "";
  Object.keys(data).forEach((key) => {
    ioLog += `<span class='output-key'>${key}</span> : ${JSON.stringify(
      data[key]
    )}<br/><br/>`;
  });
  document.querySelector("#io-output").innerHTML = ioLog;
};

window.addEventListener("message", (e) => {
  displayIOData(e.data);
});

const removeElements = () => {
  const iframe = document.querySelector(".observed-iframe");

  if (iframe) {
    page.removeChild(iframe);
  }

  if (io) {
    io.disconnect();
  }

  isDataExtractedFromChildIframe = false;
};

getVisibilityDataFromIframe.addEventListener("click", () => {
  removeElements();

  const iframe = document.createElement("iframe");
  iframe.src =
    "https://myarcane.github.io/intersection-observer-playground/iframes/iframe_with_io.html";
  iframe.width = 480;
  iframe.height = 270;
  iframe.setAttribute("id", "child-iframe");
  iframe.setAttribute("frameborder", "0");
  iframe.className = "observed-iframe";

  page.insertBefore(iframe, page.children[0]);
  target = iframe;

  stepIndex++;
  displayBtnForStep();
  isDataExtractedFromChildIframe = true;
});

getVisibilityDataFromPage.addEventListener("click", () => {
  removeElements();

  const iframe = document.createElement("iframe");
  iframe.src = "https://io-playground.netlify.app/iframe_without_io.html";
  iframe.width = 480;
  iframe.height = 270;
  iframe.setAttribute("id", "child-iframe");
  iframe.setAttribute("frameborder", "0");
  iframe.className = "observed-iframe";
  page.insertBefore(iframe, page.children[0]);
  target = iframe;

  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        let averagePosition = "";
        if (e.intersectionRatio === 0) {
          averagePosition = "outside";
        } else if (e.intersectionRatio < 1) {
          if (e.boundingClientRect.top < e.intersectionRect.top) {
            averagePosition = "top";
          } else {
            averagePosition = "bottom";
          }
        } else {
          averagePosition = "inside";
        }

        ioData = {
          boundingClientRect: e.boundingClientRect,
          intersectionRect: e.intersectionRect,
          isIntersecting: e.isIntersecting,
          intersectionRatio: e.intersectionRatio,
          isVisible: e.isVisible,
          "viewport size": getViewportSize(),
          "average position / viewport": averagePosition,
          "rect position / viewport": iframe.getBoundingClientRect(),
        };
        displayIOData(ioData);
        console.log(e);
      });
    },
    {
      /* Using default options. Details below */
      threshold: [0, 0.25, 0.5, 0.75, 1],
      trackVisibility: true,
      delay: 100,
    }
  );
  // Start observing an element
  io.observe(iframe);
  stepIndex++;
  displayBtnForStep();
  isDataExtractedFromChildIframe = false;
});

toggleTargetOpacity.addEventListener("click", () => {
  if (opacity === 1) {
    target.style.opacity = "0";
    opacity = 0;
  } else {
    target.style.opacity = "1";
    opacity = 1;
  }
});

getTargetPosition.addEventListener("click", () => {
  if (target) {
    if (isDataExtractedFromChildIframe) {
      target.contentWindow.postMessage("GET_POSITION", "*");
    } else {
      ioData = {
        ...ioData,
        "rect position / viewport": target.getBoundingClientRect(),
      };
      displayIOData(ioData);
    }
  }
});

const getViewportSize = () => {
  let topWindow = null;

  try {
    topWindow = window.top;
  } catch (error) {
    console.error(error);
    return undefined;
  }

  const vw =
    topWindow.innerWidth ||
    topWindow.document.documentElement.clientWidth ||
    topWindow.document.body.clientWidth ||
    0;
  const vh =
    topWindow.innerHeight ||
    topWindow.document.documentElement.clientHeight ||
    topWindow.document.body.clientHeight ||
    0;

  return `${vw} x ${vh}`;
};

const displayBtnForStep = () => {
  Object.keys(stepsBtns).forEach(function (key) {
    if (key == stepIndex) {
      const btnsToDisplay = stepsBtns[key];
      btnsToDisplay.forEach(function (btn) {
        btn.style.display = "inline-block";
      });
    } else {
      const btnsToHide = stepsBtns[key];
      btnsToHide.forEach(function (btn) {
        btn.style.display = "none";
      });
    }
  });
};

displayBtnForStep();

window.onresize = () => {
  if (target && !isDataExtractedFromChildIframe) {
    ioData = {
      ...ioData,
      "viewport size": getViewportSize(),
    };
    displayIOData(ioData);
  }
};
