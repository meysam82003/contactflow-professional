using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

namespace ContactFlow.SequentialFileRenamer;

internal sealed class RenameEntry
{
    public RenameEntry(string path)
    {
        OriginalPath = Path.GetFullPath(path);
        CurrentPath = OriginalPath;
    }

    public string OriginalPath { get; }
    public string CurrentPath { get; set; }
    public string DraftName { get; set; } = string.Empty;
    public string Status { get; set; } = "در انتظار";
    public string LastError { get; set; } = string.Empty;
    public string FileName => Path.GetFileName(CurrentPath);
}

internal sealed record RenameAction(RenameEntry Entry, string BeforePath, string AfterPath);

internal static partial class RenameRules
{
    [DllImport("shlwapi.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern int StrCmpLogicalW(string left, string right);

    public static int NaturalCompare(string left, string right) => StrCmpLogicalW(left, right);

    public static string CleanFileName(string value)
    {
        var cleaned = (value ?? string.Empty).Normalize(NormalizationForm.FormC).Trim();
        foreach (var invalid in Path.GetInvalidFileNameChars()) cleaned = cleaned.Replace(invalid, '_');
        cleaned = Regex.Replace(cleaned, @"\s+", " ").TrimEnd(' ', '.');
        return cleaned;
    }

    public static string DestinationFor(RenameEntry entry, string typedName, bool preserveExtension)
    {
        var cleaned = CleanFileName(typedName);
        if (string.IsNullOrWhiteSpace(cleaned)) throw new InvalidOperationException("نام جدید نمی‌تواند خالی باشد.");

        var extension = Path.GetExtension(entry.CurrentPath);
        if (preserveExtension && !string.IsNullOrEmpty(extension))
        {
            if (cleaned.EndsWith(extension, StringComparison.OrdinalIgnoreCase)) cleaned = cleaned[..^extension.Length];
            cleaned = CleanFileName(cleaned) + extension;
        }

        var directory = Path.GetDirectoryName(entry.CurrentPath) ?? throw new InvalidOperationException("پوشهٔ فایل پیدا نشد.");
        var destination = Path.GetFullPath(Path.Combine(directory, cleaned));
        if (!string.Equals(directory, Path.GetDirectoryName(destination), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("نام جدید نباید مسیر یا پوشه داشته باشد.");
        if (!string.Equals(destination, entry.CurrentPath, StringComparison.OrdinalIgnoreCase) && File.Exists(destination))
            throw new IOException($"فایلی با نام «{Path.GetFileName(destination)}» از قبل وجود دارد.");
        return destination;
    }

    public static string ApplySequenceTemplate(string template, int number)
    {
        var value = string.IsNullOrWhiteSpace(template) ? "فایل {n:000}" : template.Trim();
        value = NumberToken().Replace(value, match => number.ToString(new string('0', match.Groups[1].Value.Length)));
        value = value.Replace("{n}", number.ToString(), StringComparison.OrdinalIgnoreCase);
        return CleanFileName(value);
    }

    [GeneratedRegex(@"\{n:(0+)\}", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex NumberToken();
}
