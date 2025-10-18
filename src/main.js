import { supabase } from './supabase.js';
import { generateTitles } from './titleGenerator.js';

let currentSummaries = [];

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
  renderSummaries();
}

function renderSummaries() {
  const listContainer = document.getElementById('summaries-list');
  listContainer.innerHTML = '';

  if (currentSummaries.length === 0) {
    listContainer.innerHTML = '<p style="color: #666; text-align: center;">No summaries yet. Add one above to get started.</p>';
    return;
  }

  currentSummaries.forEach(summary => {
    const summaryCard = document.createElement('div');
    summaryCard.className = 'summary-card';

    const titlesHtml = summary.titles && summary.titles.length > 0
      ? summary.titles
          .sort((a, b) => a.title_number - b.title_number)
          .map(t => `<div class="title-item"><strong>Title ${t.title_number}:</strong> ${t.title_text}</div>`)
          .join('')
      : '<p style="color: #999;">No titles generated yet</p>';

    summaryCard.innerHTML = `
      <div class="summary-header">
        <div>
          <strong>Summary ID:</strong> ${summary.id.slice(0, 8)}...
          <br>
          <small style="color: #666;">Created: ${new Date(summary.created_at).toLocaleString()}</small>
        </div>
        <button class="delete-btn" onclick="deleteSummary('${summary.id}')">Delete</button>
      </div>
      <div class="summary-content">${summary.content.substring(0, 200)}...</div>
      ${summary.custom_instructions ? `<div class="custom-instructions"><strong>Custom Instructions:</strong> ${summary.custom_instructions}</div>` : ''}
      <div class="titles-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0;">Generated Titles:</h4>
          <button class="generate-btn" onclick="generateTitlesForSummary('${summary.id}')">
            ${summary.titles && summary.titles.length > 0 ? 'Regenerate Titles' : 'Generate Titles'}
          </button>
        </div>
        <div class="titles-list">${titlesHtml}</div>
      </div>
    `;

    listContainer.appendChild(summaryCard);
  });
}

async function saveSummary() {
  const content = document.getElementById('summary-input').value.trim();
  const customInstructions = document.getElementById('custom-instructions').value.trim();

  if (!content) {
    alert('Please enter a summary');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  const { data, error } = await supabase
    .from('summaries')
    .insert([{
      content,
      custom_instructions: customInstructions || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving summary:', error);
    alert('Error saving summary: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Summary';
    return;
  }

  document.getElementById('summary-input').value = '';
  document.getElementById('custom-instructions').value = '';

  submitBtn.disabled = false;
  submitBtn.textContent = 'Save Summary';

  await loadSummaries();
}

async function generateTitlesForSummary(summaryId) {
  const summary = currentSummaries.find(s => s.id === summaryId);
  if (!summary) return;

  const titles = generateTitles(summary.content, summary.custom_instructions || '');

  await supabase
    .from('titles')
    .delete()
    .eq('summary_id', summaryId);

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
}

async function deleteSummary(summaryId) {
  if (!confirm('Are you sure you want to delete this summary and all its titles?')) {
    return;
  }

  const { error } = await supabase
    .from('summaries')
    .delete()
    .eq('id', summaryId);

  if (error) {
    console.error('Error deleting summary:', error);
    alert('Error deleting summary: ' + error.message);
    return;
  }

  await loadSummaries();
}

window.saveSummary = saveSummary;
window.generateTitlesForSummary = generateTitlesForSummary;
window.deleteSummary = deleteSummary;

document.addEventListener('DOMContentLoaded', () => {
  loadSummaries();
});
