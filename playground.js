const page = document.querySelector("#page");
const btnCreateIOFromIframe = document.querySelector("#create-io-from-iframe");
const btnCreateIOFromPage = document.querySelector("#create-io-from-page");
const btnToggleTragetOpacity = document.querySelector("#toggle-target-opacity");
const btnGetTargetPosition = document.querySelector("#get-target-position");
let io = null;
let opacity = 1;
let target = null;
let ioData = null;
let stepIndex = 1;

const stepsBtns = {
  1: [btnCreateIOFromIframe, btnCreateIOFromPage],
  2: [btnToggleTragetOpacity, btnGetTargetPosition],
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
};

btnCreateIOFromIframe.addEventListener("click", () => {
  removeElements();

  const iframe = document.createElement("iframe");
  iframe.src = "./iframes/iframe_with_io.html";
  iframe.width = 480;
  iframe.height = 270;
  iframe.setAttribute("frameborder", "0");
  iframe.className = "observed-iframe";

  page.insertBefore(iframe, page.children[0]);
  target = iframe;

  stepIndex++;
  displayBtnForStep();
});

btnCreateIOFromPage.addEventListener("click", () => {
  removeElements();

  const iframe = document.createElement("iframe");
  iframe.src = "./iframes/iframe_without_io.html";
  iframe.width = 480;
  iframe.height = 270;
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
          position: iframe.getBoundingClientRect(),
          averagePosition: averagePosition,
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
});

btnToggleTragetOpacity.addEventListener("click", () => {
  if (opacity === 1) {
    target.style.opacity = "0";
    opacity = 0;
  } else {
    target.style.opacity = "1";
    opacity = 1;
  }
});

btnGetTargetPosition.addEventListener("click", () => {
  if (target) {
    ioData = { ...ioData, position: target.getBoundingClientRect() };
    displayIOData(ioData);
  }
});

const displayBtnForStep = () => {
  Object.keys(stepsBtns).forEach(function (key) {
    console.log("###key", key);
    if (key == stepIndex) {
      console.log("###step index");
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
