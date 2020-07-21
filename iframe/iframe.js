const observedDiv = document.querySelector("#observed");

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

      const ioData = {
        boundingClientRect: e.boundingClientRect,
        intersectionRect: e.intersectionRect,
        isIntersecting: e.isIntersecting,
        intersectionRatio: e.intersectionRatio,
        isVisible: e.isVisible,
        extraData: "_________________________________________________",
        position: observedDiv.getBoundingClientRect(),
        averagePosition: averagePosition,
      };
      console.log("iframe io", JSON.stringify(ioData));
      console.log(e);
      window.parent.parent.postMessage(ioData, "*");
    });
  },
  {
    /* Using default options. Details below */
    threshold: [0, 0.25, 0.5, 0.75, 1],
  }
);
// Start observing an element
io.observe(observedDiv);
