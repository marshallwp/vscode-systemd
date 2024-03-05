import { ExtensionContext, languages, workspace } from "vscode";
import { ExtensionConfig } from "./config/vscode-config-loader";
import { SystemdDiagnosticManager } from "./diagnostics";
import { languageId } from "./syntax/const-language-conf";
import { SystemdCompletionProvider } from "./vscode-completion";
import { SystemdSignatureProvider } from "./vscode-signature";
import { vscodeConfigNS } from "./config/vscode-config";
import { HintDataManagers } from "./hint-data/manager/multiple";
import { SystemdLint } from "./vscode-lint";
import { SystemdCommands } from "./commands/vscode-commands";
import { SystemdCodeLens } from "./vscode-codelens";
import { SystemdDocumentManager } from "./vscode-documents";
import { SystemdCapabilities } from "./hint-data/manager/capabilities";

export function activate(context: ExtensionContext) {
    const hintDataManager = new HintDataManagers();
    const config = ExtensionConfig.init(context);
    hintDataManager.init();
    SystemdCapabilities.init();

    const subs = context.subscriptions;
    const selector = [languageId];
    const diagnostics = SystemdDiagnosticManager.get();

    const docs = SystemdDocumentManager.init();
    const completion = new SystemdCompletionProvider(config, hintDataManager);
    const signature = new SystemdSignatureProvider(hintDataManager);
    const lint = new SystemdLint(config, hintDataManager);
    const codeLens = new SystemdCodeLens(config, hintDataManager);
    const commands = new SystemdCommands();

    subs.push(
        workspace.onDidChangeConfiguration((e) => {
            if (!e.affectsConfiguration(vscodeConfigNS)) return;

            config.reload();
            completion.afterChangedConfig();
            if (config.lintDirectiveKeys) lint.lintAll();
            else diagnostics.clear();
        })
    );
    subs.push(completion.register());
    subs.push(signature.register());
    subs.push(languages.registerHoverProvider(selector, signature));
    subs.push(languages.registerCodeActionsProvider(selector, lint));
    subs.push(languages.registerCodeLensProvider(selector, codeLens));
    subs.push(
        workspace.onDidOpenTextDocument((doc) => {
            if (docs.onDidOpenTextDocument(doc)) lint.onDidOpenTextDocument(doc);
        })
    );
    subs.push(workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri)));
    subs.push(workspace.onDidChangeTextDocument(lint.onDidChangeTextDocument));

    subs.push(commands.register("addUnknownDirective"));
    subs.push(commands.register("changeUnitFileType"));

    docs.event((doc) => {
        const docs = workspace.textDocuments.filter((it) => it.fileName === doc.fileName);
        for (const doc of docs) lint.lintDocumentAsync(doc);
    });
    subs.push(docs);
    if (config.lintDirectiveKeys) lint.lintAll();
}

export function deactivate() {
    // noop
}
