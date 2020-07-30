const observedDiv = document.querySelector("#observed");
let ioData = null;

const io = new IntersectionObserver(
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
          averagePosition = `${e.intersectionRect.top > 1 ? "top" : "bottom"} ${
            e.intersectionRect.left > 1 ? "left" : "right"
          }`;
        } else if (
          e.intersectionRect.width < e.boundingClientRect.width &&
          e.intersectionRect.height === e.boundingClientRect.height
        ) {
          averagePosition = e.intersectionRect.left > 1 ? "left" : "right";
        } else if (
          e.intersectionRect.height < e.boundingClientRect.height &&
          e.intersectionRect.width === e.boundingClientRect.width
        ) {
          averagePosition = e.intersectionRect.top > 1 ? "top" : "bottom";
        }
      } else {
        averagePosition = "inside";
      }

      ioData = {
        viewportSize: getViewportSize()
          ? `${getViewportSize().vw} x ${getViewportSize().vh}`
          : getViewportSize(),
        targetSize: `${document.body.getBoundingClientRect().width} x ${
          document.body.getBoundingClientRect().height
        }`,
        boundingClientRect: e.boundingClientRect,
        intersectionRect: e.intersectionRect,
        isIntersecting: e.isIntersecting,
        intersectionRatio: e.intersectionRatio,
        isVisible: e.isVisible,
        intersectionPosition: averagePosition,
        bulkRatio: getViewportSize()
          ? (e.intersectionRect.width * e.intersectionRect.height) /
            (getViewportSize().vw * getViewportSize().vh)
          : undefined,
        getBoundingClientRect: getTargetFromParentDocument()
          ? getTargetFromParentDocument().getBoundingClientRect()
          : undefined,
        xScrollDistanceToVisibility: getTargetFromParentDocument()
          ? getXScrollDistanceToVisibilty(
              getTargetFromParentDocument(),
              e.intersectionRatio
            )
          : undefined,

        yScrollDistanceToVisibility: getTargetFromParentDocument()
          ? getYScrollDistanceToVisibilty(
              getTargetFromParentDocument(),
              e.intersectionRatio
            )
          : undefined,
        isHidden: isNodeHidden(),
        isClipped: isNodeClipped(),
      };
      console.log("iframe io", JSON.stringify(ioData));
      console.log(e);
      window.parent.postMessage(ioData, "*");
    });
  },
  {
    /* Using default options. Details below */
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  }
);
// Start observing an element
io.observe(document.body);

const getTargetFromParentDocument = () => {
  try {
    const parentDocument = window.parent.document;
    return parentDocument.getElementById("child-iframe");
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const getViewportSize = () => {
  let topWindow = null;
  let vw = null;
  let vh = null;

  try {
    topWindow = window.top;
    vw =
      topWindow.innerWidth ||
      topWindow.document.documentElement.clientWidth ||
      topWindow.document.body.clientWidth ||
      0;
    vh =
      topWindow.innerHeight ||
      topWindow.document.documentElement.clientHeight ||
      topWindow.document.body.clientHeight ||
      0;
  } catch (error) {
    console.error(error);
    return undefined;
  }

  return { vw, vh };
};

function isNodeHidden() {
  try {
    const parentDocument = window.parent.document;
    let node = parentDocument.getElementById("child-iframe");
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
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

function isNodeClipped(node) {
  try {
    const parentDocument = window.parent.document;
    let node = parentDocument.getElementById("child-iframe");
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
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

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

window.addEventListener("message", (e) => {
  if (e.data === "GET_POSITION") {
    console.log("Get position from child iframe");
    ioData = {
      ...ioData,
      "rect position / viewport": getPositionWithinParentPage(),
    };
  } else if (e.data === "IS_NODE_HIDDEN") {
    ioData = {
      ...ioData,
      isHidden: isNodeHidden(),
    };
  } else if (e.data === "IS_NODE_CLIPPED") {
    ioData = {
      ...ioData,
      isNodeClipped: isNodeClipped(),
    };
  }

  window.parent.postMessage(ioData, "*");
});

window.top.addEventListener("scroll", function () {
  ioData = {
    ...ioData,
    getBoundingClientRect: target.getBoundingClientRect(),
    xScrollDistanceToVisibility: getXScrollDistanceToVisibilty(
      getTargetFromParentDocument(),
      ioData.intersectionRatio
    ),
    yScrollDistanceToVisibility: getYScrollDistanceToVisibilty(
      getTargetFromParentDocument(),
      ioData.intersectionRatio
    ),
  };

  window.parent.postMessage(ioData, "*");
});

window.top.onresize = () => {
  const { vw, vh } = getViewportSize();
  ioData = {
    ...ioData,
    viewportSize: `${vw} x ${vh}`,
    bulkRatio:
      (ioData.intersectionRect.width * ioData.intersectionRect.height) /
      (vw * vh),
  };

  window.parent.postMessage(ioData, "*");
};
