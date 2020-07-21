const page = document.querySelector("#page");
const btnAddIframe = document.querySelector("#add-iframe");
const btnAddDiv = document.querySelector("#add-div");
const btnToggleOpacity = document.querySelector("#toggle-opacity");
let io = null;
let opacity = 1;
let target = null;

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
  const div = document.querySelector(".observed-div");

  if (iframe) {
    page.removeChild(iframe);
  }

  if (div) {
    page.removeChild(div);
  }

  if (io) {
    io.disconnect();
  }
};

btnAddIframe.addEventListener("click", () => {
  removeElements();

  const iframe = document.createElement("iframe");
  iframe.src = "./iframe/iframe.html";
  iframe.width = 480;
  iframe.height = 270;
  iframe.setAttribute("frameborder", "0");
  iframe.className = "observed-iframe";

  page.insertBefore(iframe, page.children[1]);
  target = iframe;
});

btnAddDiv.addEventListener("click", () => {
  removeElements();

  const div = document.createElement("div");
  div.className = "observed-div";
  div.innerHTML = "child div";
  page.insertBefore(div, page.children[1]);
  target = div;

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

        const ioData = {
          boundingClientRect: e.boundingClientRect,
          intersectionRect: e.intersectionRect,
          isIntersecting: e.isIntersecting,
          intersectionRatio: e.intersectionRatio,
          isVisible: e.isVisible,
          extraData: "_________________________________________________",
          position: div.getBoundingClientRect(),
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
  io.observe(div);
});

btnToggleOpacity.addEventListener("click", () => {
  if (opacity === 1) {
    target.style.opacity = "0";
    opacity = 0;
  } else {
    target.style.opacity = "1";
    opacity = 1;
  }
});
