const page = document.querySelector("#page");
const toggleTargetOpacity = document.querySelector("#toggle-target-opacity");
const toggleTargetVisibility = document.querySelector(
  "#toggle-target-visibility"
);
const toggleTargetDisplay = document.querySelector("#toggle-target-display");
const selectContext = document.querySelector("#select-context");
const toggleFixedMode = document.querySelector("#toggle-fixed-mode");
const toggleOverflowMode = document.querySelector("#toggle-overflow-mode");

let io = null;
let opacity = "1";
let visibility = "visible";
let display = "inline";
let position = "absolute";
let overflow = "visible";
let target = null;
let visibilityData = null;
let stepIndex = 1;
let isDataExtractedFromChildIframe = false;

const GITHUB_URL =
  "https://myarcane.github.io/intersection-observer-playground/";
const NETLIFY_URL = "https://io-playground.netlify.app/";

const stepsBtns = {
  2: [
    toggleTargetDisplay,
    toggleTargetVisibility,
    toggleTargetOpacity,
    toggleFixedMode,
    toggleOverflowMode,
  ],
};

const ioParams = [
  "boundingClientRect",
  "intersectionRect",
  "intersectionRatio",
  "isIntersecting",
  "isVisible",
];

const displayVisibilityData = (data) => {
  visibilityData = data;
  let ioLog = "";
  Object.keys(data).forEach((key) => {
    ioLog += `<span class='${
      ioParams.includes(key) ? "output-io-key" : "output-key"
    }'>${key}</span> : ${JSON.stringify(data[key])}<br/><br/>`;
  });
  document.querySelector("#io-output").innerHTML = ioLog;
};

window.addEventListener("message", (e) => {
  displayVisibilityData(e.data);
});

const clean = () => {
  const iframe = document.querySelector(".observed-iframe");

  if (iframe) {
    page.removeChild(iframe);
  }

  if (io) {
    io.disconnect();
  }

  isDataExtractedFromChildIframe = false;
  stepIndex = 1;
  displayBtnForStep();
  displayVisibilityData({});
};

const getVisibilityDataFromIframe = (crossorigin = true) => {
  clean();

  const iframe = document.createElement("iframe");
  iframe.src = `${
    window.location.protocol === "file:"
      ? "./"
      : crossorigin
      ? NETLIFY_URL
      : GITHUB_URL
  }iframes/iframe_with_io.html`;
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
};

const getVisibilityDataFromPage = () => {
  clean();

  const iframe = document.createElement("iframe");
  iframe.src = `${
    window.location.protocol === "file:" ? "./" : GITHUB_URL
  }iframes/iframe_without_io.html`;
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
          if (
            e.intersectionRect.width < e.boundingClientRect.width &&
            e.intersectionRect.height < e.boundingClientRect.height
          ) {
            averagePosition = `${
              e.intersectionRect.top === 0 ? "top" : "bottom"
            } ${e.intersectionRect.left === 0 ? "left" : "right"}`;
          } else if (
            e.intersectionRect.width < e.boundingClientRect.width &&
            e.intersectionRect.height === e.boundingClientRect.height
          ) {
            averagePosition = e.intersectionRect.left === 0 ? "left" : "right";
          } else if (
            e.intersectionRect.height < e.boundingClientRect.height &&
            e.intersectionRect.width === e.boundingClientRect.width
          ) {
            averagePosition = e.intersectionRect.top === 0 ? "top" : "bottom";
          }
        } else {
          averagePosition = "inside";
        }

        const { vw, vh } = getViewportSize();

        visibilityData = {
          isBrowserTabVisible: !document.hidden,
          viewportSize: `${vw} x ${vh}`,
          targetSize: `${iframe.getBoundingClientRect().width} x ${
            iframe.getBoundingClientRect().height
          }`,
          boundingClientRect: e.boundingClientRect,
          intersectionRect: e.intersectionRect,
          isIntersecting: e.isIntersecting,
          intersectionRatio: e.intersectionRatio,
          isVisible: e.isVisible,
          intersectionPosition: averagePosition,
          bulkRatio:
            (e.intersectionRect.width * e.intersectionRect.height) / (vw * vh),
          getBoundingClientRect: iframe.getBoundingClientRect(),
          xScrollDistanceToVisibility: getXScrollDistanceToVisibilty(
            iframe,
            e.intersectionRatio
          ),
          yScrollDistanceToVisibility: getYScrollDistanceToVisibilty(
            iframe,
            e.intersectionRatio
          ),
          isHidden: isNodeHidden(iframe),
          isClipped: isNodeClipped(iframe),
        };
        displayVisibilityData(visibilityData);
        console.log(e);
      });
    },
    {
      /* Using default options. Details below */
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      trackVisibility: true,
      delay: 100,
    }
  );
  // Start observing an element
  io.observe(iframe);
  stepIndex++;
  displayBtnForStep();
  isDataExtractedFromChildIframe = false;
};

toggleFixedMode.addEventListener("click", () => {
  if (position === "fixed") {
    target.style.position = "absolute";
    position = "absolute";
    target.style.top = "101vh";
    target.style.left = "80vh";
  } else {
    target.style.position = "fixed";
    position = "fixed";
    const { vh, vw } = getViewportSize();
    const left = (vw - 500 - target.getBoundingClientRect().width) / 2;
    const top = (vh - 100 - target.getBoundingClientRect().height) / 2 + 100;
    target.style.top = `${top}px`;
    target.style.left = `${left}px`;
  }
  target.style.position = position;

  if (isDataExtractedFromChildIframe) {
    target.contentWindow.postMessage("IS_NODE_CLIPPED", "*");
  } else {
    displayVisibilityData({
      ...visibilityData,
      isClipped: isNodeClipped(target),
    });
  }
});

toggleTargetOpacity.addEventListener("click", () => {
  opacity = opacity === "1" ? "0" : "1";
  target.style.opacity = opacity;
  displayVisibilityData({
    ...visibilityData,
    isHidden: isNodeHidden(target),
  });

  if (isDataExtractedFromChildIframe) {
    target.contentWindow.postMessage("IS_NODE_HIDDEN", "*");
  } else {
    displayVisibilityData({
      ...visibilityData,
      isHidden: isNodeHidden(target),
    });
  }
});

toggleTargetVisibility.addEventListener("click", () => {
  visibility = visibility === "visible" ? "hidden" : "visible";
  target.style.visibility = visibility;

  if (isDataExtractedFromChildIframe) {
    target.contentWindow.postMessage("IS_NODE_HIDDEN", "*");
  } else {
    displayVisibilityData({
      ...visibilityData,
      isHidden: isNodeHidden(target),
    });
  }
});

toggleOverflowMode.addEventListener("click", () => {
  overflow = overflow === "visible" ? "hidden" : "visible";
  document.body.style.overflow = overflow;

  if (isDataExtractedFromChildIframe) {
    target.contentWindow.postMessage("IS_NODE_CLIPPED", "*");
  } else {
    displayVisibilityData({
      ...visibilityData,
      isClipped: isNodeClipped(target),
    });
  }
});

toggleTargetDisplay.addEventListener("click", () => {
  display = display === "inline" ? "none" : "inline";
  target.style.display = display;
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

  return { vw, vh };
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

window.onresize = () => {
  if (target && !isDataExtractedFromChildIframe) {
    const { vw, vh } = getViewportSize();
    displayVisibilityData({
      ...visibilityData,
      viewportSize: `${vw} x ${vh}`,
      bulkRatio:
        (visibilityData.intersectionRect.width *
          visibilityData.intersectionRect.height) /
        (vw * vh),
    });
  }
};

function isNodeHidden(node) {
  while (node) {
    const styles = window.getComputedStyle(node);
    if (
      styles.getPropertyValue("visibility").toLowerCase() === "hidden" ||
      styles.getPropertyValue("opacity").toLocaleLowerCase() === "0"
    ) {
      return true;
    }
    node =
      node.parentNode instanceof HTMLElement && node.tagName !== "BODY"
        ? node.parentNode
        : null;
  }
  return false;
}

function isNodeClipped(node) {
  let isClipped = true;
  while (node) {
    if (
      node.style.position === "fixed" ||
      document.body.style.overflow === "hidden"
    ) {
      break;
    } else if (
      node.scrollHeight === node.clientHeight &&
      node.scrollWidth === node.clientWidth
    ) {
      node =
        node.parentNode instanceof HTMLElement && node.tagName !== "BODY"
          ? node.parentNode
          : null;
    } else {
      isClipped = false;
      break;
    }
  }
  return isClipped;
}

selectContext.addEventListener("change", (event) => {
  switch (event.target.value) {
    case "visibility-data-from-iframe-cross-origin":
    case "visibility-data-from-iframe-same-origin":
      getVisibilityDataFromIframe(
        event.target.value === "visibility-data-from-iframe-cross-origin"
      );
      break;
    case "visibility-data-from-page":
      getVisibilityDataFromPage();
      break;

    default:
      clean();
      break;
  }
});

const getXScrollDistanceToVisibilty = (target, intersectionRatio) => {
  if (intersectionRatio !== 0) {
    return 0;
  } else if (
    target.getBoundingClientRect().x + target.getBoundingClientRect().width <
    0
  ) {
    return Math.abs(
      target.getBoundingClientRect().x + target.getBoundingClientRect().width
    );
  } else if (target.getBoundingClientRect().x > getViewportSize().vw) {
    return target.getBoundingClientRect().x - getViewportSize().vw;
  }

  return 0;
};

const getYScrollDistanceToVisibilty = (target, intersectionRatio) => {
  if (intersectionRatio !== 0) {
    return 0;
  } else if (
    target.getBoundingClientRect().y + target.getBoundingClientRect().height <
    0
  ) {
    return Math.abs(
      target.getBoundingClientRect().y + target.getBoundingClientRect().height
    );
  } else if (target.getBoundingClientRect().y > getViewportSize().vh) {
    return target.getBoundingClientRect().y - getViewportSize().vh;
  }

  return 0;
};

window.addEventListener("scroll", function (e) {
  if (target && !isDataExtractedFromChildIframe) {
    displayVisibilityData({
      ...visibilityData,
      getBoundingClientRect: target.getBoundingClientRect(),
      xScrollDistanceToVisibility: getXScrollDistanceToVisibilty(
        target,
        visibilityData.intersectionRatio
      ),
      yScrollDistanceToVisibility: getYScrollDistanceToVisibilty(
        target,
        visibilityData.intersectionRatio
      ),
    });
  }
});

document.addEventListener("visibilitychange", () => {
  if (target && !isDataExtractedFromChildIframe) {
    displayVisibilityData({
      ...visibilityData,
      isBrowserTabVisible: !document.hidden,
    });
    console.log(visibilityData);
  }
});
