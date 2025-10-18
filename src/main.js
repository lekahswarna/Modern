import { supabase } from './supabase.js';
import { generateTitles } from './titleGenerator.js';

let currentSummaries = [];
let summaryInputCount = 1;
let customInstructions = '';
let currentGeneratingIndex = 0;

function addSummaryInput() {
  if (summaryInputCount >= 5) {
    alert('Maximum 5 summaries allowed');
    return;
  }

  const container = document.getElementById('summaries-input-container');
  const newIndex = summaryInputCount;

  const inputGroup = document.createElement('div');
  inputGroup.className = 'summary-input-group';
  inputGroup.setAttribute('data-index', newIndex);
  inputGroup.innerHTML = `
    <div class="summary-input-header">
      <label>Summary ${newIndex + 1}</label>
      <button type="button" class="remove-btn" onclick="removeSummaryInput(${newIndex})">Remove</button>
    </div>
    <textarea
      class="summary-textarea"
      placeholder="Paste your 1000-word summary here..."
      rows="6"
    ></textarea>
  `;

  container.appendChild(inputGroup);
  summaryInputCount++;

  updateAddButton();
  updateRemoveButtons();
}

function removeSummaryInput(index) {
  const container = document.getElementById('summaries-input-container');
  const inputGroup = container.querySelector(`[data-index="${index}"]`);

  if (inputGroup) {
    inputGroup.remove();
    summaryInputCount--;

    const remaining = container.querySelectorAll('.summary-input-group');
    remaining.forEach((group, idx) => {
      group.setAttribute('data-index', idx);
      group.querySelector('label').textContent = `Summary ${idx + 1}`;
      const removeBtn = group.querySelector('.remove-btn');
      removeBtn.setAttribute('onclick', `removeSummaryInput(${idx})`);
    });

    updateAddButton();
    updateRemoveButtons();
  }
}

function updateAddButton() {
  const addBtn = document.getElementById('add-summary-btn');
  if (summaryInputCount >= 5) {
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
  } else {
    addBtn.disabled = false;
    addBtn.style.opacity = '1';
  }
}

function updateRemoveButtons() {
  const container = document.getElementById('summaries-input-container');
  const groups = container.querySelectorAll('.summary-input-group');

  groups.forEach((group, idx) => {
    const removeBtn = group.querySelector('.remove-btn');
    if (groups.length === 1) {
      removeBtn.style.display = 'none';
    } else {
      removeBtn.style.display = 'inline-block';
    }
  });
}

async function uploadSummaries() {
  const container = document.getElementById('summaries-input-container');
  const textareas = container.querySelectorAll('.summary-textarea');
  const summariesToUpload = [];

  textareas.forEach(textarea => {
    const content = textarea.value.trim();
    if (content) {
      summariesToUpload.push(content);
    }
  });

  if (summariesToUpload.length === 0) {
    alert('Please enter at least one summary');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';

  for (const content of summariesToUpload) {
    const { error } = await supabase
      .from('summaries')
      .insert([{ content }]);

    if (error) {
      console.error('Error saving summary:', error);
      alert('Error saving summary: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload Summaries';
      return;
    }
  }

  textareas.forEach(textarea => {
    textarea.value = '';
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Upload Summaries';

  document.querySelector('.input-section').style.display = 'none';
  document.getElementById('summaries-section').style.display = 'block';

  await loadSummaries();
  currentGeneratingIndex = 0;
  renderGenerationView();
}

async function loadSummaries() {
  const { data, error } = await supabase
    .from('summaries')
    .select(`
      *,
      titles (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading summaries:', error);
    return;
  }

  currentSummaries = data || [];
}

function renderGenerationView() {
  const listContainer = document.getElementById('summaries-list');
  listContainer.innerHTML = '';

  if (currentSummaries.length === 0) {
    return;
  }

  const reversedSummaries = [...currentSummaries].reverse();

  reversedSummaries.forEach((summary, index) => {
    const summaryCard = document.createElement('div');
    summaryCard.className = 'summary-card';
    summaryCard.id = `summary-${summary.id}`;

    const hasTitles = summary.titles && summary.titles.length > 0;
    const isCurrentlyGenerating = index === currentGeneratingIndex;

    const titlesHtml = hasTitles
      ? summary.titles
          .sort((a, b) => a.title_number - b.title_number)
          .map(t => `<div class="title-item"><strong>Title ${t.title_number}:</strong> ${t.title_text}</div>`)
          .join('')
      : isCurrentlyGenerating
      ? '<p style="color: #999;">Ready to generate titles</p>'
      : '<p style="color: #999;">Waiting...</p>';

    summaryCard.innerHTML = `
      <div class="summary-header">
        <div>
          <strong>Summary ${index + 1}</strong>
          <br>
          <small style="color: #666;">ID: ${summary.id.slice(0, 8)}...</small>
        </div>
        ${hasTitles ? '<span class="status-badge completed">✓ Completed</span>' :
          isCurrentlyGenerating ? '<span class="status-badge current">Current</span>' :
          '<span class="status-badge pending">Pending</span>'}
      </div>
      <div class="summary-content">${summary.content.substring(0, 200)}...</div>
      <div class="titles-section">
        <h4 style="margin: 0 0 12px 0;">Generated Titles:</h4>
        <div class="titles-list">${titlesHtml}</div>
        ${isCurrentlyGenerating && !hasTitles ?
          `<button class="generate-btn" onclick="generateTitlesForCurrent('${summary.id}')">
            Generate 3 Titles
          </button>` : ''}
      </div>
    `;

    listContainer.appendChild(summaryCard);
  });

  if (currentGeneratingIndex >= reversedSummaries.length) {
    showInstructionsSection();
  }
}

async function generateTitlesForCurrent(summaryId) {
  const summary = currentSummaries.find(s => s.id === summaryId);
  if (!summary) return;

  const btn = document.querySelector(`#summary-${summaryId} .generate-btn`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
  }

  const titles = generateTitles(summary.content, customInstructions);

  for (const title of titles) {
    const { error } = await supabase
      .from('titles')
      .insert([{
        summary_id: summaryId,
        title_text: title.title_text,
        title_number: title.title_number
      }]);

    if (error) {
      console.error('Error saving title:', error);
    }
  }

  await loadSummaries();
  currentGeneratingIndex++;
  renderGenerationView();
}

function showInstructionsSection() {
  document.getElementById('instructions-section').style.display = 'block';
}

async function applyInstructionsAndContinue() {
  const instructionsInput = document.getElementById('custom-instructions');
  customInstructions = instructionsInput.value.trim();

  document.getElementById('instructions-section').style.display = 'none';

  const allCompleted = currentSummaries.every(s => s.titles && s.titles.length > 0);

  if (allCompleted) {
    alert('All titles have been generated!');
  } else {
    renderGenerationView();
  }
}

window.addSummaryInput = addSummaryInput;
window.removeSummaryInput = removeSummaryInput;
window.uploadSummaries = uploadSummaries;
window.generateTitlesForCurrent = generateTitlesForCurrent;
window.applyInstructionsAndContinue = applyInstructionsAndContinue;

document.addEventListener('DOMContentLoaded', () => {
  updateRemoveButtons();
});
