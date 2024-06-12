// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { WOS, getBackendHostPort, getORefSubject, sendWSCommand } from "@/store/global";
import * as services from "@/store/services";
import { base64ToArray } from "@/util/util";
import { FitAddon } from "@xterm/addon-fit";
import type { ITheme } from "@xterm/xterm";
import { Terminal } from "@xterm/xterm";
import * as React from "react";

import { debounce } from "throttle-debounce";
import "./view.less";
import "/public/xterm.css";

function getThemeFromCSSVars(el: Element): ITheme {
    const theme: ITheme = {};
    const elemStyle = getComputedStyle(el);
    theme.foreground = elemStyle.getPropertyValue("--term-foreground");
    theme.background = elemStyle.getPropertyValue("--term-background");
    theme.black = elemStyle.getPropertyValue("--term-black");
    theme.red = elemStyle.getPropertyValue("--term-red");
    theme.green = elemStyle.getPropertyValue("--term-green");
    theme.yellow = elemStyle.getPropertyValue("--term-yellow");
    theme.blue = elemStyle.getPropertyValue("--term-blue");
    theme.magenta = elemStyle.getPropertyValue("--term-magenta");
    theme.cyan = elemStyle.getPropertyValue("--term-cyan");
    theme.white = elemStyle.getPropertyValue("--term-white");
    theme.brightBlack = elemStyle.getPropertyValue("--term-bright-black");
    theme.brightRed = elemStyle.getPropertyValue("--term-bright-red");
    theme.brightGreen = elemStyle.getPropertyValue("--term-bright-green");
    theme.brightYellow = elemStyle.getPropertyValue("--term-bright-yellow");
    theme.brightBlue = elemStyle.getPropertyValue("--term-bright-blue");
    theme.brightMagenta = elemStyle.getPropertyValue("--term-bright-magenta");
    theme.brightCyan = elemStyle.getPropertyValue("--term-bright-cyan");
    theme.brightWhite = elemStyle.getPropertyValue("--term-bright-white");
    theme.selectionBackground = elemStyle.getPropertyValue("--term-selection-background");
    theme.selectionInactiveBackground = elemStyle.getPropertyValue("--term-selection-background");
    theme.cursor = elemStyle.getPropertyValue("--term-selection-background");
    theme.cursorAccent = elemStyle.getPropertyValue("--term-cursor-accent");
    return theme;
}

function handleResize(fitAddon: FitAddon, blockId: string, term: Terminal) {
    if (term == null) {
        return;
    }
    const oldRows = term.rows;
    const oldCols = term.cols;
    fitAddon.fit();
    if (oldRows !== term.rows || oldCols !== term.cols) {
        const wsCommand: SetBlockTermSizeWSCommand = {
            wscommand: "setblocktermsize",
            blockid: blockId,
            termsize: { rows: term.rows, cols: term.cols },
        };
        sendWSCommand(wsCommand);
    }
}

type InitialLoadDataType = {
    loaded: boolean;
    heldData: Uint8Array[];
};

const TerminalView = ({ blockId }: { blockId: string }) => {
    const connectElemRef = React.useRef<HTMLDivElement>(null);
    const termRef = React.useRef<Terminal>(null);
    const initialLoadRef = React.useRef<InitialLoadDataType>({ loaded: false, heldData: [] });
    React.useEffect(() => {
        console.log("terminal created");
        const newTerm = new Terminal({
            theme: getThemeFromCSSVars(connectElemRef.current),
            fontSize: 12,
            fontFamily: "Hack",
            drawBoldTextInBrightColors: false,
            fontWeight: "normal",
            fontWeightBold: "bold",
        });
        termRef.current = newTerm;
        const newFitAddon = new FitAddon();
        newTerm.loadAddon(newFitAddon);
        newTerm.open(connectElemRef.current);
        newFitAddon.fit();
        // services.BlockService.SendCommand(blockId, {
        //     command: "controller:input",
        //     termsize: { rows: newTerm.rows, cols: newTerm.cols },
        // });
        sendWSCommand({
            wscommand: "setblocktermsize",
            blockid: blockId,
            termsize: { rows: newTerm.rows, cols: newTerm.cols },
        });
        newTerm.onData((data) => {
            const b64data = btoa(data);
            const inputCmd: BlockInputCommand = { command: "controller:input", inputdata64: b64data };
            services.BlockService.SendCommand(blockId, inputCmd);
        });

        // block subject
        const blockSubject = getORefSubject(WOS.makeORef("block", blockId));
        blockSubject.subscribe((data) => {
            // base64 decode
            const decodedData = base64ToArray(data.ptydata);
            if (initialLoadRef.current.loaded) {
                newTerm.write(decodedData);
            } else {
                initialLoadRef.current.heldData.push(decodedData);
            }
        });
        // load data from filestore
        const startTs = Date.now();
        let loadedBytes = 0;
        const localTerm = termRef.current; // avoids devmode double effect running issue (terminal gets created twice)
        const usp = new URLSearchParams();
        usp.set("zoneid", blockId);
        usp.set("name", "main");
        fetch(getBackendHostPort() + "/wave/file?" + usp.toString())
            .then((resp) => {
                if (resp.ok) {
                    return resp.arrayBuffer();
                }
                console.log("error loading file", resp.status, resp.statusText);
            })
            .then((data: ArrayBuffer) => {
                const uint8View = new Uint8Array(data);
                localTerm.write(uint8View);
                loadedBytes = uint8View.byteLength;
            })
            .finally(() => {
                initialLoadRef.current.heldData.forEach((data) => {
                    localTerm.write(data);
                });
                initialLoadRef.current.loaded = true;
                initialLoadRef.current.heldData = [];
                console.log(`terminal loaded file ${loadedBytes} bytes, ${Date.now() - startTs}ms`);
            });

        const resize_debounced = debounce(50, () => {
            handleResize(newFitAddon, blockId, newTerm);
        });
        const rszObs = new ResizeObserver(() => {
            resize_debounced();
        });
        rszObs.observe(connectElemRef.current);

        return () => {
            newTerm.dispose();
            blockSubject.release();
        };
    }, []);

    return (
        <div className="view-term">
            <div key="conntectElem" className="term-connectelem" ref={connectElemRef}></div>
        </div>
    );
};

export { TerminalView };
