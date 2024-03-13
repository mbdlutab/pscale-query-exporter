let lastIdx = 0;

const queryResultsObj = {};

const parentClass = "-ml-1 -mr-1 rounded border-2 px-1 py-1 border-transparent";

function doExportCSV(idx) {
  const rows = queryResultsObj[idx];

  let output = "";
  for (let x = 0; x < rows.length - 1; x++) {
    const row = rows[x];
    if (x == 0) {
      let headersStr = "";
      let rowStr = "";
      const keys = Object.keys(row);
      keys.forEach((key, idx) => {
        const hasItems = idx != keys.length - 1;
        const separator = hasItems ? "," : "";
        headersStr = `${headersStr}${key}${separator}`;
        rowStr = `${rowStr}${row[key]}${separator}`;
      });

      output = `${output}${headersStr}\n${rowStr}\n`;
    } else {
      let rowStr = "";
      const keys = Object.keys(row);
      keys.forEach((key, idx) => {
        const hasItems = idx != keys.length - 1;
        const separator = hasItems ? "," : "";
        rowStr = `${rowStr}${row[key]}${separator}`;
      });
      output = `${output}${rowStr}\n`;
    }
  }

  const fileName = `PSCALE_EXPORT_CSV_${Date.now()}`;
  const type = "text/csv";
  createDownloadable(output, type, fileName);
}

function doExportJSON(idx) {
  const content = JSON.stringify(queryResultsObj[idx], null, 4);
  const fileName = `PSCALE_EXPORT_JSON_${Date.now()}`;
  const type = "application/json";

  createDownloadable(content, type, fileName);
}

function createDownloadable(content, type, fileName) {
  const blob = new Blob([content], { type });

  const link = document.createElement("a");

  link.download = fileName;
  link.href = URL.createObjectURL(blob);

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
}

function doInjectButtons(node) {
  const uniqueIdCsv = `pscale-export-csv-${lastIdx}`;
  const uniqueIdJson = `pscale-export-json-${lastIdx}`;

  const buttonHTML = `
  <div class="mb-1 flex items-center space-x-1 font-sans sm:mb-0">
    <div class="relative inline-flex">
      <button id="${uniqueIdCsv}" type="button" class="box-border relative inline-flex items-center justify-center text-center no-underline leading-none whitespace-nowrap font-semibold rounded shrink-0 transition select-none overflow-hidden focus-ring hover:bg-secondary text-primary border border-contrast bg-primary text-sm py-1 h-3.5 px-1.5">Export to CSV</button>
    </div>
    <button id="${uniqueIdJson}" type="button" class="pscale-export box-border relative inline-flex items-center justify-center text-center no-underline leading-none whitespace-nowrap font-semibold rounded shrink-0 transition select-none overflow-hidden focus-ring hover:bg-secondary text-primary border border-contrast bg-primary text-sm py-1 h-3.5 px-1.5">Export to JSON</button>
  </div>
`;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = buttonHTML;

  while (tempDiv.firstChild) {
    node.appendChild(tempDiv.firstChild);
  }

  // Child node placement will always be in this format
  const buttons = Array.from(node.getElementsByTagName("button"));
  const csvNode = buttons[2];
  csvNode.addEventListener("click", () => {
    const id = uniqueIdCsv.split("-")[3];
    doExportCSV(id);
  });

  const jsonNode = buttons[3];
  jsonNode.addEventListener("click", () => {
    const id = uniqueIdJson.split("-")[3];
    doExportJSON(id);
  });
}

function handleMutation(mutationsList, _) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      // Check if a new div with class 'mb-4' has been added
      const addedNodes = mutation.addedNodes;
      for (const node of addedNodes) {
        const hasClassList = node && node.classList;
        const classList = hasClassList
          ? Array.from(node.classList).join(" ")
          : "";

        if (hasClassList && classList == parentClass) {
          // pl-2
          const secondChildNode = Array.from(node.childNodes)[1];

          // mb-4, NOTE: Edge case if there are other div.mb-4
          const secondChildNodeInnerDiv = Array.from(
            secondChildNode.childNodes
          )[0];

          if (secondChildNodeInnerDiv) {
            // Get table node
            const tableParent = Array.from(
              secondChildNodeInnerDiv.childNodes
            )[0];

            const tableNode = Array.from(tableParent.childNodes)[1];

            // Check if there's no table node since the "tableParent" can contain DOM Node for INSERT, UPDATE or DELETE results.
            if (!tableNode) {
              return;
            }

            const tableNodeChildren = Array.from(tableNode.childNodes);
            // Get thead > tr > th[]
            const tHeadNode = tableNodeChildren[0];
            const tHeadTrNode = tHeadNode.firstChild;
            const thNodes = Array.from(tHeadTrNode.childNodes);

            const headers = [];
            for (const th of thNodes) {
              headers.push(th.textContent);
            }

            // Get tbody > tr[] > td[]
            const tBodyNode = tableNodeChildren[1];
            const tBodyTrNodes = Array.from(tBodyNode.childNodes);

            const rows = [];
            // Inevitable On^2
            for (const tr of tBodyTrNodes) {
              const rowObj = {};
              const tdNodes = Array.from(tr.childNodes);

              tdNodes.forEach((td, idx) => {
                const header = headers[idx];
                rowObj[header] = td.textContent;
              });

              rows.push(rowObj);
            }

            queryResultsObj[lastIdx] = rows;

            doInjectButtons(secondChildNodeInnerDiv);

            lastIdx++;
          }
        }
      }
    }
  }
}

const observer = new MutationObserver(handleMutation);

const targetNode = document.body; // You can change this to observe a different part of the DOM
const config = { childList: true, subtree: true };

observer.observe(targetNode, config);
