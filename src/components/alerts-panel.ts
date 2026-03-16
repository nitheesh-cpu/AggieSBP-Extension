import { extractTermFromUrl, convertUrlTermToTermCode, isRegistrationPage } from '../utils/page-detector';
import { trackSection, untrackSection, getTrackedSections, TrackedSection } from '../services/tracking-service';
import { debugLog } from '../utils/debug';

function buildSectionId(termCode: string, crn: string, subject: string, courseNumber: string, section: string): string {
  return `${termCode}-${crn}-${subject}-${courseNumber}-${section}`;
}

function parseSectionId(sectionId: string): { termCode: string; crn: string; subject: string; courseNumber: string; section: string } | null {
  const parts = sectionId.split('-');
  if (parts.length < 5) return null;
  const [termCode, crn, subject, courseNumber, section] = parts;
  return { termCode, crn, subject, courseNumber, section };
}

function renderTrackedList(container: HTMLElement, tracked: TrackedSection[]): void {
  const list = document.createElement('div');
  list.className = 'aggiesbp-alerts-list';

  if (tracked.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'aggiesbp-alerts-empty';
    empty.textContent = 'You are not watching any sections yet.';
    list.appendChild(empty);
    container.appendChild(list);
    return;
  }

  tracked.forEach((item) => {
    const parsed = parseSectionId(item.section_id);
    const row = document.createElement('div');
    row.className = 'aggiesbp-alerts-row';

    if (!parsed) {
      row.textContent = `${item.section_id}`;
      list.appendChild(row);
      return;
    }

    const label = document.createElement('span');
    label.className = 'aggiesbp-alerts-label';
    label.textContent = `${parsed.subject} ${parsed.courseNumber}-${parsed.section} (CRN ${parsed.crn}, ${parsed.termCode})`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'aggiesbp-alerts-remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      const ok = await untrackSection(item.section_id);
      if (ok) {
        row.remove();
      } else {
        alert('Failed to remove alert. Please try again.');
      }
    });

    row.appendChild(label);
    row.appendChild(removeBtn);
    list.appendChild(row);
  });

  container.appendChild(list);
}

function renderAddAlertsSection(container: HTMLElement, termCode: string | null): void {
  const addAlertsWrapper = document.createElement('div');
  addAlertsWrapper.className = 'aggiesbp-alerts-discovery-wrapper';
  addAlertsWrapper.style.padding = '0 16px';

  const note = document.createElement('p');
  note.className = 'aggiesbp-alerts-note';
  note.textContent = 'Add alerts for sections to be notified when seats open up.';
  addAlertsWrapper.appendChild(note);

  // --- MANUAL ENTRY FORM ---
  const manualForm = document.createElement('div');
  manualForm.style.display = 'flex';
  manualForm.style.flexDirection = 'column';
  manualForm.style.gap = '8px';
  manualForm.style.marginBottom = '20px';

  const manualTitle = document.createElement('div');
  manualTitle.textContent = 'Manual Entry';
  manualTitle.style.fontWeight = 'bold';
  manualTitle.style.fontSize = '12px';
  manualTitle.style.marginBottom = '4px';
  manualForm.appendChild(manualTitle);

  const inputsRow1 = document.createElement('div');
  inputsRow1.style.display = 'flex';
  inputsRow1.style.gap = '8px';

  const createInput = (placeholder: string, flex = '1') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'aggiesbp-alerts-field';
    wrapper.style.flex = flex;
    wrapper.style.gap = '0'; 

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = placeholder;
    inp.className = 'aggiesbp-alerts-input';
    
    wrapper.appendChild(inp);
    return { wrapper, inp };
  };

  const subjObj = createInput('Subj (CSCE)');
  const crseObj = createInput('Crse (313)');
  const secObj  = createInput('Sec (501)');
  
  const subjInput = subjObj.inp;
  const crseInput = crseObj.inp;
  const secInput = secObj.inp;
  
  inputsRow1.appendChild(subjObj.wrapper);
  inputsRow1.appendChild(crseObj.wrapper);
  inputsRow1.appendChild(secObj.wrapper);

  const inputsRow2 = document.createElement('div');
  inputsRow2.style.display = 'flex';
  inputsRow2.style.gap = '8px';

  const crnObj = createInput('CRN (12345)');
  const crnInput = crnObj.inp;

  const manualSubmitBtn = document.createElement('button');
  manualSubmitBtn.className = 'aggiesbp-alerts-submit';
  manualSubmitBtn.textContent = '+ Add';
  manualSubmitBtn.style.flex = '0.5';
  manualSubmitBtn.style.margin = '0'; // override default top margin
  
  inputsRow2.appendChild(crnObj.wrapper);
  inputsRow2.appendChild(manualSubmitBtn);

  manualForm.appendChild(inputsRow1);
  manualForm.appendChild(inputsRow2);
  addAlertsWrapper.appendChild(manualForm);

  manualSubmitBtn.addEventListener('click', async () => {
    if (!termCode) {
      alert('Error: Could not determine current term code from page.');
      return;
    }
    const subj = subjInput.value.trim().toUpperCase();
    const crse = crseInput.value.trim();
    const sec = secInput.value.trim();
    const crn = crnInput.value.trim();

    if (!subj || !crse || !crn) {
      alert('Please provide at least Subject, Course, and CRN for manual alerts.');
      return;
    }

    manualSubmitBtn.disabled = true;
    manualSubmitBtn.textContent = '...';

    const sectionId = buildSectionId(termCode, crn, subj, crse, sec || 'XXX');
    const ok = await trackSection(sectionId, termCode);
    if (ok) {
      subjInput.value = '';
      crseInput.value = '';
      secInput.value = '';
      crnInput.value = '';
      manualSubmitBtn.textContent = 'Added \u2713';
      setTimeout(() => { manualSubmitBtn.textContent = '+ Add'; manualSubmitBtn.disabled = false; }, 2000);
      alert('Alert added! Refresh the tab to see it.');
    } else {
      manualSubmitBtn.disabled = false;
      manualSubmitBtn.textContent = '+ Add';
      alert('Failed to add alert. Ensure you are logged into AggieSB+ in this browser.');
    }
  });


  // --- AUTO SCANNER ---
  const autoTitle = document.createElement('div');
  autoTitle.textContent = 'Or scan page for sections:';
  autoTitle.style.fontWeight = 'bold';
  autoTitle.style.fontSize = '12px';
  autoTitle.style.marginBottom = '8px';
  addAlertsWrapper.appendChild(autoTitle);

  const scanBtn = document.createElement('button');
  scanBtn.className = 'aggiesbp-alerts-submit'; 
  scanBtn.textContent = 'Find Sections On Page';
  scanBtn.style.marginBottom = '16px';
  scanBtn.style.alignSelf = 'flex-start';
  scanBtn.style.marginTop = '0';
  addAlertsWrapper.appendChild(scanBtn);
  
  container.appendChild(addAlertsWrapper);

  const doScan = () => {
    scanBtn.textContent = 'Scanning...';
    scanBtn.disabled = true;

    setTimeout(() => {
      const discoveredSections: { label: string; crn: string; sectionId: string }[] = [];
      
      if (!termCode) {
        debugLog('No termCode found, cannot scan sections.');
      } else {
        const mainContent = document.querySelector('main') || document.body;
        const potentialRows = mainContent.querySelectorAll('tr, div[role=\"row\"], .row, .grid-row');
        const rows = Array.from(potentialRows).filter(r => !r.closest('#professor-compare-panel'));
        
        debugLog(`Scanning ${rows.length} rows for sections...`);
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td, div[role=\"cell\"], div[role=\"gridcell\"], .cell'));
          if (cells.length < 3) return; 
          
          let crn = '';
          let subject = '';
          let courseNumber = '';
          let section = '';
          
          if (cells.length >= 8) {
             const crnCell = cells[2] as HTMLElement;
             const subjCell = cells[3] as HTMLElement;
             const courseCell = cells[4] as HTMLElement;
             const secCell = cells[5] as HTMLElement;

             crn = (crnCell.innerText || crnCell.textContent || '').trim();
             subject = (subjCell.innerText || subjCell.textContent || '').trim();
             courseNumber = (courseCell.innerText || courseCell.textContent || '').trim();
             section = (secCell.innerText || secCell.textContent || '').trim();
          }

          if (!crn || !subject || !courseNumber) {
              cells.forEach(cell => {
                 const text = (cell as HTMLElement).innerText || cell.textContent || '';
                 const trimmedText = text.trim();
                 if (/^\d{5}$/.test(trimmedText) && !crn) crn = trimmedText;
                 if (/^[a-zA-Z]{3,4}$/.test(trimmedText) && !subject) subject = trimmedText.toUpperCase();
                 if (/^\d{3}$/.test(trimmedText) && subject && !courseNumber) courseNumber = trimmedText;
              });
          }
          
          const rawCrn = crn.replace(/\\D/g, ''); 
          if (rawCrn.length >= 5) {
             try {
                 const finalCrn = rawCrn.substring(0, 5);
                 const finalSubj = (subject || 'UNKNOWN').toUpperCase();
                 const finalCourse = courseNumber || 'XXX';
                 const sec = section || 'XXX'; 
                 
                 const sectionId = buildSectionId(termCode, finalCrn, finalSubj, finalCourse, sec);
                 const label = `${finalSubj} ${finalCourse}-${sec} (CRN ${finalCrn})`;
                 
                 if (!discoveredSections.some(s => s.crn === finalCrn)) {
                     discoveredSections.push({ label, crn: finalCrn, sectionId });
                 }
             } catch (e) {
                 debugLog(`ERROR building section ID for ${crn}:`, e);
             }
          }
        });

        debugLog(`SCAN COMPLETE: discoveredSections array has ${discoveredSections.length} items`);
      }

      // COMPLETELY NEW RENDER LOGIC: We must assume our local 'discoveryWrapper' closure
      // reference might point to a DETACHED widget if main.ts re-initialized the panel
      // during the timeout. We must strictly query the live DOM to inject results.
      
      let liveWrapper: HTMLElement | null = null;
      const mainExt = document.querySelector('#professor-compare-panel') || document.querySelector('.prof-sidebar-container');
      
      if (mainExt && mainExt.shadowRoot) {
          liveWrapper = mainExt.shadowRoot.querySelector('.aggiesbp-alerts-discovery-wrapper');
      }

      if (!liveWrapper) {
          debugLog('FATAL: Live discovery wrapper not found in shadow DOM! Panel might have been destroyed.');
          // Fallback just in case standard DOM
          liveWrapper = document.querySelector('.aggiesbp-alerts-discovery-wrapper');
          if (!liveWrapper) {
              scanBtn.textContent = 'Scan Failed (Panel Lost)';
              scanBtn.disabled = false;
              return;
          }
      }

      // Destroy old injected list inside the LIVE wrapper
      const oldList = liveWrapper.querySelector('.aggiesbp-alerts-discovered');
      if (oldList) oldList.remove();

      // Ensure we build a completely fresh node every time
      const freshListContainer = document.createElement('div');
      freshListContainer.id = 'aggiesbp-alerts-list-live-container';
      freshListContainer.className = 'aggiesbp-alerts-list aggiesbp-alerts-discovered';

      if (discoveredSections.length === 0) {
        freshListContainer.style.display = 'block';
        freshListContainer.innerHTML = '<p class=\"aggiesbp-alerts-empty\">No full sections found. (Ensure the rows are visible on screen, then try scanning again).</p>';
      } else {
        debugLog(`Rendering ${discoveredSections.length} discovered sections to LIVE panel`);
        
        freshListContainer.style.setProperty('display', 'flex', 'important');
        freshListContainer.style.setProperty('flex-direction', 'column', 'important');
        freshListContainer.style.setProperty('gap', '8px', 'important');
        freshListContainer.style.setProperty('margin-top', '12px', 'important');
        
        // Ensure no weird absolute positioning overrides
        freshListContainer.style.setProperty('position', 'relative', 'important'); 
        freshListContainer.style.setProperty('visibility', 'visible', 'important');
        
        discoveredSections.forEach(item => {
          const row = document.createElement('div');
          row.className = 'aggiesbp-alerts-row aggiesbp-discovered-row';
          
          const label = document.createElement('span');
          label.className = 'aggiesbp-alerts-label';
          label.textContent = item.label;
          
          const addBtn = document.createElement('button');
          addBtn.className = 'aggiesbp-alerts-add-btn';
          addBtn.textContent = '+ Add Alert';
          
          addBtn.addEventListener('click', async () => {
            if (!termCode) return;
            addBtn.disabled = true;
            addBtn.textContent = 'Adding...';
            
            const ok = await trackSection(item.sectionId, termCode);
            if (ok) {
              addBtn.textContent = 'Added \u2713';
              addBtn.classList.add('success');
              alert('Alert added! Refresh the tab to see it in your watched sections.');
            } else {
              addBtn.disabled = false;
              addBtn.textContent = '+ Add Alert';
              alert('Failed to add alert. Make sure you are logged into AggieSB+ in this browser.');
            }
          });
          
          row.appendChild(label);
          row.appendChild(addBtn);
          freshListContainer.appendChild(row);
        });
        debugLog(`Successfully appended ${freshListContainer.children.length} elements to the LIVE container`);
      }
      
      // Inject back into the strictly live DOM wrapper
      liveWrapper.appendChild(freshListContainer);
      scanBtn.textContent = 'Find Sections On Page';
      scanBtn.disabled = false;
    }, 500); // reduced timeout slightly, we don't need a massive delay since we read the live DOM.
  };

  scanBtn.addEventListener('click', doScan);
  
  // Auto-scan initially
  doScan();
}

export async function renderAlertsTab(container: HTMLElement, skipPageCheck = false): Promise<void> {
  if (!skipPageCheck && !isRegistrationPage()) return;

  const term = extractTermFromUrl();
  const termCode = term ? convertUrlTermToTermCode(term) : null;

  container.innerHTML = '';

  const header = document.createElement('h2');
  header.className = 'aggiesbp-alerts-title';
  header.textContent = 'Seat Alerts';

  container.appendChild(header);

  renderAddAlertsSection(container, termCode);

  const listHeader = document.createElement('h3');
  listHeader.className = 'aggiesbp-alerts-subtitle';
  listHeader.textContent = 'Watched sections';
  container.appendChild(listHeader);

  try {
    const tracked = await getTrackedSections();
    renderTrackedList(container, tracked);
  } catch (e) {
    debugLog('Failed to load tracked sections for alerts tab', e);
  }

  debugLog('Alerts tab rendered in sidebar');
}
