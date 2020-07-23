const observedDiv = document.querySelector("#observed");
let ioData = null;

const io = new IntersectionObserver(
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
        "vewport size": getViewportSize(),
        "average position / viewport": averagePosition,
        "rect position / viewport": getPositionWithinParentPage(),
      };
      console.log("iframe io", JSON.stringify(ioData));
      console.log(e);
      window.parent.postMessage(ioData, "*");
    });
  },
  {
    /* Using default options. Details below */
    threshold: [0, 0.25, 0.5, 0.75, 1],
  }
);
// Start observing an element
io.observe(document.body);

const getPositionWithinParentPage = () => {
  let parentDocument = null;
  try {
    parentDocument = window.parent.document;
  } catch (error) {
    console.error(error);
    return undefined;
  }

  return parentDocument.getElementById("child-iframe").getBoundingClientRect();
};

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

window.addEventListener("message", (e) => {
  if (e.data === "GET_POSITION") {
    console.log("Get position from child iframe");
    ioData = {
      ...ioData,
      "rect position / viewport": getPositionWithinParentPage(),
    };
    window.parent.postMessage(ioData, "*");
  }
});
