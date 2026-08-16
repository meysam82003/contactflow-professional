using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ContactFlow.SequentialFileRenamer;

internal sealed class MainForm : Form
{
    private readonly List<RenameEntry> entries = [];
    private readonly Stack<RenameAction> history = [];
    private readonly HashSet<string> queuedPaths = new(StringComparer.OrdinalIgnoreCase);
    private readonly ListView queue = new();
    private readonly TextBox nameBox = new();
    private readonly Label currentLabel = new();
    private readonly Label detailLabel = new();
    private readonly Label statusLabel = new();
    private readonly ProgressBar progress = new();
    private readonly CheckBox preserveExtension = new();
    private readonly TextBox sequenceTemplate = new();
    private readonly NumericUpDown sequenceStart = new();
    private readonly Button renameButton = new();
    private readonly Button skipButton = new();
    private readonly Button undoButton = new();
    private int currentIndex = -1;
    private bool suppressUiEvents;
    private bool operationInProgress;

    private static readonly Color Background = Color.FromArgb(8, 12, 21);
    private static readonly Color Panel = Color.FromArgb(20, 27, 42);
    private static readonly Color PanelSoft = Color.FromArgb(29, 39, 59);
    private static readonly Color TextPrimary = Color.FromArgb(238, 244, 255);
    private static readonly Color TextMuted = Color.FromArgb(157, 170, 195);
    private static readonly Color Accent = Color.FromArgb(83, 218, 190);
    private static readonly Color Accent2 = Color.FromArgb(101, 134, 255);
    private static readonly Color Danger = Color.FromArgb(255, 104, 123);

    public MainForm()
    {
        Text = "ContactFlow — تغییرنام ترتیبی فایل‌ها 3.6 r3";
        Width = 1180;
        Height = 760;
        MinimumSize = new Size(940, 620);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Background;
        ForeColor = TextPrimary;
        Font = new Font("Segoe UI", 10F);
        RightToLeft = RightToLeft.Yes;
        RightToLeftLayout = true;
        KeyPreview = true;
        AllowDrop = true;

        BuildInterface();
        BindEvents();
        SetStatus("فایل‌ها را انتخاب یا داخل پنجره رها کنید.", false);
    }

    private void BuildInterface()
    {
        var root = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(18), ColumnCount = 1, RowCount = 4, BackColor = Background };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        Controls.Add(root);

        var header = new TableLayoutPanel { Dock = DockStyle.Top, Height = 76, ColumnCount = 2, BackColor = Background };
        header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        header.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        var titleWrap = new FlowLayoutPanel { FlowDirection = FlowDirection.TopDown, AutoSize = true, WrapContents = false, Margin = new Padding(0) };
        titleWrap.Controls.Add(new Label { Text = "تغییرنام ترتیبی فایل‌ها", AutoSize = true, Font = new Font("Segoe UI", 20F, FontStyle.Bold), ForeColor = TextPrimary });
        titleWrap.Controls.Add(new Label { Text = "یک‌بار انتخاب کن؛ نام را بنویس؛ Enter بزن و مستقیم برو فایل بعدی", AutoSize = true, ForeColor = TextMuted });
        header.Controls.Add(titleWrap, 0, 0);
        var headerButtons = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.RightToLeft, WrapContents = false, Anchor = AnchorStyles.Left | AnchorStyles.Top };
        var selectFiles = ButtonOf("انتخاب فایل‌ها  Ctrl+O", Accent2);
        var selectFolder = ButtonOf("افزودن پوشه", PanelSoft);
        headerButtons.Controls.Add(selectFiles);
        headerButtons.Controls.Add(selectFolder);
        header.Controls.Add(headerButtons, 1, 0);
        root.Controls.Add(header, 0, 0);

        var content = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, BackColor = Background, Margin = new Padding(0, 8, 0, 8) };
        content.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 58));
        content.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 42));
        root.Controls.Add(content, 0, 1);

        var queuePanel = PanelOf();
        queuePanel.Padding = new Padding(12);
        queue.View = View.Details;
        queue.FullRowSelect = true;
        queue.HideSelection = false;
        queue.MultiSelect = false;
        queue.Dock = DockStyle.Fill;
        queue.BackColor = Panel;
        queue.ForeColor = TextPrimary;
        queue.BorderStyle = BorderStyle.None;
        queue.Columns.Add("ردیف", 64, HorizontalAlignment.Center);
        queue.Columns.Add("نام فعلی", 275, HorizontalAlignment.Right);
        queue.Columns.Add("نام پیشنهادی", 220, HorizontalAlignment.Right);
        queue.Columns.Add("وضعیت", 115, HorizontalAlignment.Center);
        queuePanel.Controls.Add(queue);
        content.Controls.Add(queuePanel, 0, 0);

        var editor = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(22), BackColor = Panel, RowCount = 11, ColumnCount = 1, Margin = new Padding(12, 0, 0, 0) };
        for (var i = 0; i < 11; i++) editor.RowStyles.Add(i == 3 ? new RowStyle(SizeType.Percent, 100) : new RowStyle(SizeType.AutoSize));
        editor.Controls.Add(new Label { Text = "فایل جاری", AutoSize = true, ForeColor = TextMuted }, 0, 0);
        currentLabel.Text = "هنوز فایلی انتخاب نشده";
        currentLabel.AutoEllipsis = true;
        currentLabel.AutoSize = false;
        currentLabel.Height = 40;
        currentLabel.Dock = DockStyle.Top;
        currentLabel.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
        editor.Controls.Add(currentLabel, 0, 1);
        detailLabel.AutoSize = true;
        detailLabel.ForeColor = TextMuted;
        editor.Controls.Add(detailLabel, 0, 2);

        var nameTitle = new Label { Text = "نام جدید — Enter = ثبت و بعدی", AutoSize = true, ForeColor = TextMuted, Margin = new Padding(0, 20, 0, 6) };
        editor.Controls.Add(nameTitle, 0, 4);
        nameBox.Dock = DockStyle.Top;
        nameBox.Height = 44;
        nameBox.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
        nameBox.BackColor = PanelSoft;
        nameBox.ForeColor = TextPrimary;
        nameBox.BorderStyle = BorderStyle.FixedSingle;
        nameBox.RightToLeft = RightToLeft.Yes;
        nameBox.ShortcutsEnabled = true;
        editor.Controls.Add(nameBox, 0, 5);

        preserveExtension.Text = "پسوند اصلی فایل حفظ شود";
        preserveExtension.Checked = true;
        preserveExtension.AutoSize = true;
        preserveExtension.ForeColor = TextPrimary;
        preserveExtension.Margin = new Padding(0, 12, 0, 8);
        editor.Controls.Add(preserveExtension, 0, 6);

        var mainActions = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.RightToLeft, WrapContents = true };
        renameButton.Text = "ثبت و فایل بعدی  Enter";
        StyleButton(renameButton, Accent, Color.FromArgb(7, 26, 24));
        skipButton.Text = "رد کردن  Ctrl+Enter";
        StyleButton(skipButton, PanelSoft, TextPrimary);
        undoButton.Text = "برگرداندن  Ctrl+Z";
        StyleButton(undoButton, PanelSoft, TextPrimary);
        undoButton.Enabled = false;
        mainActions.Controls.Add(renameButton);
        mainActions.Controls.Add(skipButton);
        mainActions.Controls.Add(undoButton);
        editor.Controls.Add(mainActions, 0, 7);

        var separator = new Label { Height = 1, Dock = DockStyle.Top, BackColor = Color.FromArgb(55, 67, 91), Margin = new Padding(0, 18, 0, 14) };
        editor.Controls.Add(separator, 0, 8);

        var templateBox = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 3, RowCount = 2 };
        templateBox.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        templateBox.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 80));
        templateBox.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        templateBox.Controls.Add(new Label { Text = "پیشنهاد نام برای باقی صف (اختیاری)", AutoSize = true, ForeColor = TextMuted }, 0, 0);
        sequenceTemplate.Text = "فایل {n:000}";
        sequenceTemplate.Dock = DockStyle.Fill;
        sequenceTemplate.BackColor = PanelSoft;
        sequenceTemplate.ForeColor = TextPrimary;
        sequenceTemplate.BorderStyle = BorderStyle.FixedSingle;
        sequenceTemplate.RightToLeft = RightToLeft.Yes;
        templateBox.Controls.Add(sequenceTemplate, 0, 1);
        sequenceStart.Minimum = 0;
        sequenceStart.Maximum = 99999999;
        sequenceStart.Value = 1;
        sequenceStart.BackColor = PanelSoft;
        sequenceStart.ForeColor = TextPrimary;
        sequenceStart.Dock = DockStyle.Fill;
        templateBox.Controls.Add(sequenceStart, 1, 1);
        var applyTemplate = ButtonOf("پیشنهاد", Accent2);
        templateBox.Controls.Add(applyTemplate, 2, 1);
        editor.Controls.Add(templateBox, 0, 9);

        var secondary = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.RightToLeft, WrapContents = true, Margin = new Padding(0, 14, 0, 0) };
        var moveUp = ButtonOf("بالا", PanelSoft);
        var moveDown = ButtonOf("پایین", PanelSoft);
        var remove = ButtonOf("حذف از صف", Danger);
        var report = ButtonOf("گزارش CSV", PanelSoft);
        secondary.Controls.Add(moveUp);
        secondary.Controls.Add(moveDown);
        secondary.Controls.Add(remove);
        secondary.Controls.Add(report);
        editor.Controls.Add(secondary, 0, 10);
        content.Controls.Add(editor, 1, 0);

        progress.Dock = DockStyle.Top;
        progress.Height = 8;
        progress.Style = ProgressBarStyle.Continuous;
        root.Controls.Add(progress, 0, 2);
        statusLabel.AutoSize = true;
        statusLabel.Padding = new Padding(0, 8, 0, 0);
        statusLabel.ForeColor = TextMuted;
        root.Controls.Add(statusLabel, 0, 3);

        selectFiles.Click += (_, _) => SelectFiles();
        selectFolder.Click += (_, _) => SelectFolder();
        renameButton.Click += async (_, _) => await RenameCurrentAsync();
        skipButton.Click += (_, _) => SkipCurrent();
        undoButton.Click += (_, _) => UndoLast();
        applyTemplate.Click += (_, _) => ApplyTemplateToRemaining();
        moveUp.Click += (_, _) => MoveSelected(-1);
        moveDown.Click += (_, _) => MoveSelected(1);
        remove.Click += (_, _) => RemoveSelected();
        report.Click += (_, _) => SaveReport();
    }

    private void BindEvents()
    {
        queue.SelectedIndexChanged += (_, _) =>
        {
            if (suppressUiEvents || queue.SelectedIndices.Count == 0) return;
            var selectedIndex = queue.SelectedIndices[0];
            if (selectedIndex != currentIndex) SelectIndex(selectedIndex);
        };
        nameBox.TextChanged += (_, _) =>
        {
            if (suppressUiEvents) return;
            if (currentIndex >= 0 && currentIndex < entries.Count) entries[currentIndex].DraftName = nameBox.Text;
            RefreshDraftCell(currentIndex);
            UpdateProgress();
        };
        nameBox.KeyDown += async (_, eventArgs) =>
        {
            if (eventArgs.KeyCode != Keys.Enter) return;
            eventArgs.SuppressKeyPress = true;
            eventArgs.Handled = true;
            if (eventArgs.Control) SkipCurrent(); else await RenameCurrentAsync();
        };
        KeyDown += (_, eventArgs) =>
        {
            if (eventArgs.Control && eventArgs.KeyCode == Keys.O) { SelectFiles(); eventArgs.SuppressKeyPress = true; }
            else if (eventArgs.Control && eventArgs.KeyCode == Keys.Z) { UndoLast(); eventArgs.SuppressKeyPress = true; }
            else if (eventArgs.KeyCode == Keys.Up && eventArgs.Alt) { MoveSelected(-1); eventArgs.SuppressKeyPress = true; }
            else if (eventArgs.KeyCode == Keys.Down && eventArgs.Alt) { MoveSelected(1); eventArgs.SuppressKeyPress = true; }
        };
        DragEnter += (_, eventArgs) => eventArgs.Effect = eventArgs.Data?.GetDataPresent(DataFormats.FileDrop) == true ? DragDropEffects.Copy : DragDropEffects.None;
        DragDrop += (_, eventArgs) =>
        {
            if (eventArgs.Data?.GetData(DataFormats.FileDrop) is not string[] paths) return;
            AddPaths(paths.SelectMany(path => Directory.Exists(path) ? Directory.EnumerateFiles(path) : new[] { path }));
        };
    }

    private static Panel PanelOf() => new() { Dock = DockStyle.Fill, BackColor = Panel, Margin = new Padding(0) };

    private static Button ButtonOf(string text, Color background)
    {
        var button = new Button { Text = text, AutoSize = true, MinimumSize = new Size(104, 38), Margin = new Padding(5) };
        StyleButton(button, background, background == Accent ? Color.FromArgb(7, 26, 24) : TextPrimary);
        return button;
    }

    private static void StyleButton(Button button, Color background, Color foreground)
    {
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderSize = 0;
        button.BackColor = background;
        button.ForeColor = foreground;
        button.Cursor = Cursors.Hand;
        button.Padding = new Padding(10, 3, 10, 3);
    }

    private void SelectFiles()
    {
        try
        {
            using var dialog = new OpenFileDialog { Multiselect = true, CheckFileExists = true, DereferenceLinks = true, Filter = "همهٔ فایل‌ها (*.*)|*.*", Title = "فایل‌ها را به ترتیب انتخاب کنید", RestoreDirectory = true };
            if (dialog.ShowDialog(this) == DialogResult.OK) AddPaths(dialog.FileNames);
            else SetStatus("انتخاب لغو شد؛ صف قبلی دست‌نخورده ماند.", false);
        }
        catch (Exception exception) { SetStatus($"خواندن انتخاب فایل ناموفق بود: {exception.Message}", true); }
    }

    private void SelectFolder()
    {
        try
        {
            using var dialog = new FolderBrowserDialog { Description = "فایل‌های پوشه به ترتیب طبیعی نام اضافه می‌شوند", ShowNewFolderButton = false };
            if (dialog.ShowDialog(this) == DialogResult.OK) AddPaths(Directory.EnumerateFiles(dialog.SelectedPath));
            else SetStatus("انتخاب پوشه لغو شد؛ صف قبلی دست‌نخورده ماند.", false);
        }
        catch (Exception exception) { SetStatus($"خواندن پوشه ناموفق بود: {exception.Message}", true); }
    }

    private void AddPaths(IEnumerable<string> paths)
    {
        var readable = new List<string>();
        var rejected = 0;
        try
        {
            foreach (var rawPath in paths)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(rawPath) || !File.Exists(rawPath)) { rejected++; continue; }
                    var path = Path.GetFullPath(rawPath);
                    if (queuedPaths.Add(path)) readable.Add(path);
                }
                catch { rejected++; }
            }
        }
        catch { rejected++; }
        var added = readable.OrderBy(path => Path.GetFileName(path), Comparer<string>.Create(RenameRules.NaturalCompare)).ToList();
        foreach (var path in added) entries.Add(new RenameEntry(path));
        RebuildQueue();
        if (entries.Count > 0) SelectIndex(currentIndex < 0 ? 0 : currentIndex);
        var message = added.Count == 0 ? "فایل جدیدی اضافه نشد." : $"{added.Count:N0} فایل اضافه شد؛ جمع صف {entries.Count:N0} فایل است.";
        if (rejected > 0) message += $" • {rejected:N0} مسیر خراب یا بدون دسترسی رد شد.";
        SetStatus(message, added.Count == 0 && rejected > 0);
    }

    private void RebuildQueue()
    {
        var wasSuppressed = suppressUiEvents;
        suppressUiEvents = true;
        queue.BeginUpdate();
        try
        {
            queue.Items.Clear();
            for (var index = 0; index < entries.Count; index++) queue.Items.Add(ItemFor(entries[index], index));
        }
        finally
        {
            queue.EndUpdate();
            suppressUiEvents = wasSuppressed;
        }
        UpdateProgress();
    }

    private static ListViewItem ItemFor(RenameEntry entry, int index)
    {
        var item = new ListViewItem((index + 1).ToString()) { Tag = entry };
        item.SubItems.Add(entry.FileName);
        item.SubItems.Add(entry.DraftName);
        item.SubItems.Add(entry.Status);
        if (entry.Status == "انجام شد") item.ForeColor = Accent;
        else if (entry.Status == "خطا") item.ForeColor = Danger;
        else item.ForeColor = TextPrimary;
        return item;
    }

    private void RefreshRow(int index)
    {
        if (index < 0 || index >= entries.Count || index >= queue.Items.Count) return;
        var entry = entries[index];
        var item = queue.Items[index];
        item.Text = (index + 1).ToString();
        item.SubItems[1].Text = entry.FileName;
        item.SubItems[2].Text = entry.DraftName;
        item.SubItems[3].Text = entry.Status;
        item.ForeColor = entry.Status == "انجام شد" ? Accent : entry.Status == "خطا" ? Danger : TextPrimary;
    }

    private void RefreshDraftCell(int index)
    {
        if (index < 0 || index >= entries.Count || index >= queue.Items.Count) return;
        queue.Items[index].SubItems[2].Text = entries[index].DraftName;
    }

    private void SelectIndex(int index)
    {
        if (entries.Count == 0) { currentIndex = -1; return; }
        var wasSuppressed = suppressUiEvents;
        suppressUiEvents = true;
        try
        {
            currentIndex = Math.Clamp(index, 0, entries.Count - 1);
            for (var i = 0; i < queue.Items.Count; i++) queue.Items[i].Selected = i == currentIndex;
            queue.EnsureVisible(currentIndex);
            var entry = entries[currentIndex];
            currentLabel.Text = entry.FileName;
            detailLabel.Text = $"{currentIndex + 1:N0} از {entries.Count:N0}  •  {Path.GetDirectoryName(entry.CurrentPath)}";
            var draft = string.IsNullOrWhiteSpace(entry.DraftName) ? Path.GetFileNameWithoutExtension(entry.CurrentPath) : entry.DraftName;
            if (!string.Equals(nameBox.Text, draft, StringComparison.Ordinal)) nameBox.Text = draft;
        }
        finally { suppressUiEvents = wasSuppressed; }
        nameBox.Focus();
        nameBox.SelectAll();
        UpdateProgress();
    }

    private async Task RenameCurrentAsync()
    {
        if (operationInProgress) return;
        if (currentIndex < 0 || currentIndex >= entries.Count) { SetStatus("ابتدا فایل انتخاب کنید.", true); return; }
        operationInProgress = true;
        SetEditorBusy(true);
        var renameIndex = currentIndex;
        var entry = entries[currentIndex];
        string? errorMessage = null;
        var renamed = false;
        try
        {
            var destination = RenameRules.DestinationFor(entry, nameBox.Text, preserveExtension.Checked);
            if (string.Equals(destination, entry.CurrentPath, StringComparison.Ordinal))
            {
                entry.Status = "بدون تغییر";
                entry.LastError = string.Empty;
            }
            else
            {
                var before = entry.CurrentPath;
                await MoveFileWithRetryAsync(before, destination);
                queuedPaths.Remove(before);
                queuedPaths.Add(destination);
                entry.CurrentPath = destination;
                entry.DraftName = Path.GetFileNameWithoutExtension(destination);
                entry.Status = "انجام شد";
                entry.LastError = string.Empty;
                history.Push(new RenameAction(entry, before, destination));
                undoButton.Enabled = true;
            }
            renamed = true;
        }
        catch (Exception exception)
        {
            entry.Status = "خطا";
            entry.LastError = exception.Message;
            errorMessage = exception.Message;
        }
        finally
        {
            operationInProgress = false;
            SetEditorBusy(false);
        }

        try
        {
            RefreshRow(renameIndex);
            if (!renamed)
            {
                SetStatus(errorMessage ?? "تغییرنام انجام نشد.", true);
                nameBox.Focus();
                return;
            }

            SetStatus($"ثبت شد: {entry.FileName}", false);
            await Task.Yield();
            if (!IsDisposed && currentIndex == renameIndex) MoveToNext();
        }
        catch (Exception exception)
        {
            ReportUnexpectedError(exception);
        }
    }

    private static async Task MoveFileWithRetryAsync(string source, string destination)
    {
        const int attempts = 4;
        for (var attempt = 1; attempt <= attempts; attempt++)
        {
            try
            {
                File.Move(source, destination);
                return;
            }
            catch (IOException) when (attempt < attempts && !File.Exists(destination))
            {
                await Task.Delay(80 * attempt);
            }
        }
    }

    private void SetEditorBusy(bool busy)
    {
        queue.Enabled = !busy;
        nameBox.Enabled = !busy;
        preserveExtension.Enabled = !busy;
        skipButton.Enabled = !busy;
        undoButton.Enabled = !busy && history.Count > 0;
        renameButton.Enabled = !busy && currentIndex >= 0;
    }

    private void SkipCurrent()
    {
        if (operationInProgress) return;
        if (currentIndex < 0 || currentIndex >= entries.Count) return;
        entries[currentIndex].Status = "رد شد";
        entries[currentIndex].LastError = string.Empty;
        RefreshRow(currentIndex);
        MoveToNext();
    }

    private void MoveToNext()
    {
        if (currentIndex + 1 < entries.Count) SelectIndex(currentIndex + 1);
        else
        {
            UpdateProgress();
            SetStatus("به انتهای صف رسیدی؛ فایل‌های خطادار یا ردشده را می‌توانی دوباره انتخاب کنی.", false);
            nameBox.SelectAll();
        }
    }

    private void UndoLast()
    {
        if (operationInProgress) return;
        if (!history.TryPop(out var action)) return;
        try
        {
            if (!File.Exists(action.AfterPath)) throw new IOException("فایل تغییرنام‌داده‌شده دیگر در مسیر فعلی نیست.");
            if (File.Exists(action.BeforePath)) throw new IOException("نام قبلی اکنون توسط فایل دیگری اشغال شده است.");
            File.Move(action.AfterPath, action.BeforePath);
            queuedPaths.Remove(action.AfterPath);
            queuedPaths.Add(action.BeforePath);
            action.Entry.CurrentPath = action.BeforePath;
            action.Entry.DraftName = Path.GetFileNameWithoutExtension(action.BeforePath);
            action.Entry.Status = "برگردانده شد";
            action.Entry.LastError = string.Empty;
            var index = entries.IndexOf(action.Entry);
            RefreshRow(index);
            SelectIndex(index);
            SetStatus("آخرین تغییر نام برگردانده شد.", false);
        }
        catch (Exception exception)
        {
            history.Push(action);
            SetStatus(exception.Message, true);
        }
        undoButton.Enabled = history.Count > 0;
    }

    private void ApplyTemplateToRemaining()
    {
        if (operationInProgress) return;
        if (entries.Count == 0) return;
        var startAt = currentIndex < 0 ? 0 : currentIndex;
        var number = (int)sequenceStart.Value;
        for (var index = startAt; index < entries.Count; index++) entries[index].DraftName = RenameRules.ApplySequenceTemplate(sequenceTemplate.Text, number++);
        RebuildQueue();
        SelectIndex(startAt);
        SetStatus("نام‌های پیشنهادی ساخته شد؛ با Enter همچنان هر فایل جداگانه تأیید می‌شود.", false);
    }

    private void MoveSelected(int offset)
    {
        if (operationInProgress) return;
        if (currentIndex < 0) return;
        var target = currentIndex + offset;
        if (target < 0 || target >= entries.Count) return;
        (entries[currentIndex], entries[target]) = (entries[target], entries[currentIndex]);
        currentIndex = target;
        RebuildQueue();
        SelectIndex(currentIndex);
    }

    private void RemoveSelected()
    {
        if (operationInProgress) return;
        if (currentIndex < 0 || currentIndex >= entries.Count) return;
        var entry = entries[currentIndex];
        entries.RemoveAt(currentIndex);
        queuedPaths.Remove(entry.CurrentPath);
        RebuildQueue();
        if (entries.Count == 0)
        {
            currentIndex = -1;
            currentLabel.Text = "هنوز فایلی انتخاب نشده";
            detailLabel.Text = string.Empty;
            nameBox.Clear();
        }
        else SelectIndex(Math.Min(currentIndex, entries.Count - 1));
    }

    private void SaveReport()
    {
        if (operationInProgress) return;
        if (entries.Count == 0) { SetStatus("صف خالی است.", true); return; }
        using var dialog = new SaveFileDialog { Filter = "CSV (*.csv)|*.csv", FileName = $"ContactFlow_Rename_Report_{DateTime.Now:yyyyMMdd_HHmmss}.csv", AddExtension = true };
        if (dialog.ShowDialog(this) != DialogResult.OK) return;
        static string Cell(string value) => '"' + value.Replace("\"", "\"\"") + '"';
        var rows = entries.Select((entry, index) => string.Join(",", new[] { (index + 1).ToString(), Cell(entry.OriginalPath), Cell(entry.CurrentPath), Cell(entry.Status), Cell(entry.LastError) }));
        File.WriteAllText(dialog.FileName, "row,original_path,current_path,status,error\r\n" + string.Join("\r\n", rows), new UTF8Encoding(true));
        SetStatus("گزارش CSV ذخیره شد.", false);
    }

    private void UpdateProgress()
    {
        progress.Maximum = Math.Max(1, entries.Count);
        progress.Value = Math.Min(progress.Maximum, entries.Count(entry => entry.Status is "انجام شد" or "بدون تغییر"));
        renameButton.Enabled = !operationInProgress && currentIndex >= 0 && entries.Count > 0 && !string.IsNullOrWhiteSpace(nameBox.Text);
    }

    private void SetStatus(string message, bool error)
    {
        statusLabel.Text = message;
        statusLabel.ForeColor = error ? Danger : TextMuted;
    }

    internal void ReportUnexpectedError(Exception exception)
    {
        if (IsDisposed) return;
        var message = string.IsNullOrWhiteSpace(exception.Message) ? "خطای داخلی ناشناخته" : exception.Message;
        SetStatus($"خطای داخلی کنترل شد؛ فایل‌ها آسیبی ندیدند: {message}", true);
        try
        {
            var logPath = Path.Combine(Path.GetTempPath(), "ContactFlow_Sequential_File_Renamer.log");
            File.AppendAllText(logPath, $"{DateTimeOffset.Now:O}\t{exception}\r\n", new UTF8Encoding(false));
        }
        catch
        {
            // Logging must never interrupt the rename workflow.
        }
    }
}
