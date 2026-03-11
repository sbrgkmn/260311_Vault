import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";

function setVisible(controller, visible) {
  const row = controller?.domElement?.parentElement;
  if (!row) return;
  row.style.display = visible ? "" : "none";
}

export function createUI(initialParams, handlers) {
  const params = { ...initialParams };
  const statsElement = document.getElementById("stats");
  const gui = new GUI({
    title: "Vault Parameters",
    width: 355,
  });

  const emitParamChange = () => handlers.onParamsChange({ ...params });
  const emitDisplayChange = () => handlers.onDisplayChange({ ...params });

  const base = gui.addFolder("Base");
  base.add(params, "baseWidth", 2, 30, 0.1).name("Base Width").onChange(emitParamChange);
  base.add(params, "vaultHeight", 1, 30, 0.1).name("Vault Height").onChange(emitParamChange);
  base.add(params, "baseTriangles", 8, 24, 4).name("Base Triangles").onChange(emitParamChange);
  base.open();

  const recursion = gui.addFolder("Recursion");
  recursion.add(params, "recursionDepth", 0, 7, 1).name("Depth").onChange(emitParamChange);
  recursion
    .add(params, "smoothingIterations", 0, 4, 1)
    .name("Smoothing")
    .onChange(emitParamChange);
  recursion.add(params, "maxFaces", 2000, 400000, 1000).name("Max Faces").onFinishChange(emitParamChange);
  recursion.open();

  const pattern = gui.addFolder("Step Pattern");
  const patternController = pattern
    .add(params, "recursionPattern", {
      Constant: "constant",
      Ramp: "ramp",
      Pulse: "pulse",
      Custom: "custom",
    })
    .name("Pattern")
    .onChange(() => {
      updatePatternVisibility();
      emitParamChange();
    });

  const displacementStartController = pattern
    .add(params, "displacementStart", -2, 2, 0.01)
    .name("Disp Start")
    .onChange(emitParamChange);
  const displacementEndController = pattern
    .add(params, "displacementEnd", -2, 2, 0.01)
    .name("Disp End")
    .onChange(emitParamChange);
  const evaluationStartController = pattern
    .add(params, "evaluationStart", 2, 40, 1)
    .name("Eval Start")
    .onChange(emitParamChange);
  const evaluationEndController = pattern
    .add(params, "evaluationEnd", 2, 40, 1)
    .name("Eval End")
    .onChange(emitParamChange);
  const axialStartController = pattern
    .add(params, "axialWeightStart", 0, 1, 0.01)
    .name("Axial Start")
    .onChange(emitParamChange);
  const axialEndController = pattern
    .add(params, "axialWeightEnd", 0, 1, 0.01)
    .name("Axial End")
    .onChange(emitParamChange);
  const archStartController = pattern
    .add(params, "archExponentStart", 0.8, 4, 0.01)
    .name("Arch Start")
    .onChange(emitParamChange);
  const archEndController = pattern
    .add(params, "archExponentEnd", 0.8, 4, 0.01)
    .name("Arch End")
    .onChange(emitParamChange);

  const customDispController = pattern
    .add(params, "customDisplacementPattern")
    .name("Custom Disp List")
    .onFinishChange(emitParamChange);
  const customEvalController = pattern
    .add(params, "customEvaluationPattern")
    .name("Custom Eval List")
    .onFinishChange(emitParamChange);

  function updatePatternVisibility() {
    const mode = params.recursionPattern;
    const isCustom = mode === "custom";
    setVisible(customDispController, isCustom);
    setVisible(customEvalController, isCustom);

    const showRanges = !isCustom;
    setVisible(displacementStartController, true);
    setVisible(evaluationStartController, true);
    setVisible(axialStartController, true);
    setVisible(archStartController, true);
    setVisible(displacementEndController, showRanges);
    setVisible(evaluationEndController, showRanges);
    setVisible(axialEndController, showRanges);
    setVisible(archEndController, showRanges);
  }

  updatePatternVisibility();
  pattern.open();

  const display = gui.addFolder("Visualization");
  const shadedController = display.add(params, "shaded").name("Shaded");
  const wireframeController = display.add(params, "wireframe").name("Wireframe");
  const recursionController = display.add(params, "showRecursion").name("Recursion Colors");

  const syncDisplayModes = () => {
    if (!params.shaded && !params.wireframe) {
      params.shaded = true;
      shadedController.updateDisplay();
    }
    emitDisplayChange();
  };

  shadedController.onChange(syncDisplayModes);
  wireframeController.onChange(syncDisplayModes);
  recursionController.onChange(emitDisplayChange);
  display.open();

  const actions = {
    exportOBJ: () => handlers.onExport("obj"),
    exportSTL: () => handlers.onExport("stl"),
    exportNetwork: () => handlers.onExport("network"),
  };
  const output = gui.addFolder("Output");
  output.add(actions, "exportOBJ").name("Export OBJ");
  output.add(actions, "exportSTL").name("Export STL");
  output.add(actions, "exportNetwork").name("Download Network");
  output.open();

  return {
    params,
    updateStats(text) {
      if (statsElement) statsElement.textContent = text;
    },
    dispose() {
      gui.destroy();
    },
  };
}
