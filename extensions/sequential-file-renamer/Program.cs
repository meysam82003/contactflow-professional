using System;
using System.Windows.Forms;

namespace ContactFlow.SequentialFileRenamer;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        var mainForm = new MainForm();
        Application.ThreadException += (_, eventArgs) => mainForm.ReportUnexpectedError(eventArgs.Exception);
        Application.Run(mainForm);
    }
}
