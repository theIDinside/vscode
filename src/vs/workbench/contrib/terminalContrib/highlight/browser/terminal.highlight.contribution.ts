/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Terminal as RawXtermTerminal } from '@xterm/xterm';
import { addDisposableGenericMouseMoveListener, addDisposableListener } from 'vs/base/browser/dom';
import { Disposable } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { TerminalCapability } from 'vs/platform/terminal/common/capabilities/capabilities';
import { IDetachedTerminalInstance, ITerminalContribution, ITerminalInstance, ITerminalService, IXtermTerminal } from 'vs/workbench/contrib/terminal/browser/terminal';
import { registerTerminalContribution } from 'vs/workbench/contrib/terminal/browser/terminalExtensions';
import { TerminalWidgetManager } from 'vs/workbench/contrib/terminal/browser/widgets/widgetManager';
import { ITerminalProcessInfo, ITerminalProcessManager } from 'vs/workbench/contrib/terminal/common/terminal';


class TerminalHighlightContribution extends Disposable implements ITerminalContribution {
	static readonly ID = 'terminal.highlight';

	static get(instance: ITerminalInstance | IDetachedTerminalInstance): TerminalHighlightContribution | null {
		return instance.getContribution<TerminalHighlightContribution>(TerminalHighlightContribution.ID);
	}

	constructor(
		private readonly _instance: ITerminalInstance | IDetachedTerminalInstance,
		processManager: ITerminalProcessManager | ITerminalProcessInfo,
		widgetManager: TerminalWidgetManager,
		@IInstantiationService instantiationService: IInstantiationService,
		@ITerminalService terminalService: ITerminalService
	) {
		super();
	}

	xtermOpen(xterm: IXtermTerminal & { raw: RawXtermTerminal }): void {
		const screenElement = xterm.raw.element!.querySelector('.xterm-screen')!;
		this._register(addDisposableListener(screenElement, 'mousemove', (e: MouseEvent) => {
			console.log(e.target);
			if ((e.target as any).tagName !== 'CANVAS') {
				return;
			}
			const rect = xterm.raw.element?.getBoundingClientRect();
			if (!rect) {
				return;
			}
			const mouseCursorY = Math.floor(e.offsetY / (rect.height / xterm.raw.rows));
			console.log(`@${mouseCursorY}`, e.offsetY);
			const command = this._instance.capabilities.get(TerminalCapability.CommandDetection)?.getCommandForLine(xterm.raw.buffer.active.viewportY + mouseCursorY);
			if (command && 'getOutput' in command) {
				xterm.markTracker.highlight(command);
			} else {
				xterm.markTracker.highlight(undefined);
			}
		}));
	}
}

registerTerminalContribution(TerminalHighlightContribution.ID, TerminalHighlightContribution, false);
