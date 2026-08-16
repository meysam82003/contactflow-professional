package com.contactflow.sequentialrenamer;

final class RenameAction {
    final RenameEntry entry;
    final String beforeUri;
    final String afterUri;
    final String beforeName;
    final String afterName;

    RenameAction(RenameEntry entry, String beforeUri, String afterUri, String beforeName, String afterName) {
        this.entry = entry;
        this.beforeUri = beforeUri;
        this.afterUri = afterUri;
        this.beforeName = beforeName;
        this.afterName = afterName;
    }
}
