declare module 'codemirror/lib/codemirror.js' {
    export function fromTextArea(textarea: HTMLTextAreaElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;
    export function getValue(): string;
    export function setValue(value: string): void;

    namespace CodeMirror {
        function fromTextArea(textarea: HTMLTextAreaElement, options?: EditorConfiguration): Editor;
        function getValue(): string;
        function setValue(value: string): void;

        interface Editor {
            getValue(): string;
            setValue(value: string): void;
            on(eventName: string, handler: (instance: Editor, event: any) => void): void;
            off(eventName: string, handler: (instance: Editor, event: any) => void): void;
            refresh(): void;
            focus(): void;
            getOption(option: string): any;
            setOption(option: string, value: any): void;
            addKeyMap(map: any): void;
            removeKeyMap(map: any): void;
            addLineClass(line: number, where: string, className: string): void;
            removeLineClass(line: number, where: string, className: string): void;
            lineCount(): number;
            getLine(line: number): string;
            getCursor(): Position;
            setCursor(pos: Position): void;
            replaceRange(replacement: string, from: Position, to?: Position, origin?: string): void;
            getDoc(): Doc;
            // Add other methods and properties as needed
        }

        interface Doc {
            getValue(): string;
            setValue(value: string): void;
            replaceRange(replacement: string, from: Position, to?: Position, origin?: string): void;
            getCursor(): Position;
            setCursor(pos: Position): void;
            // Add other methods and properties as needed
        }

        interface EditorConfiguration {
            value?: string;
            mode?: string | object;
            theme?: string;
            indentUnit?: number;
            smartIndent?: boolean;
            tabSize?: number;
            indentWithTabs?: boolean;
            electricChars?: boolean;
            specialChars?: RegExp;
            specialCharPlaceholder?: (char: string) => HTMLElement;
            rtlMoveVisually?: boolean;
            keyMap?: string;
            extraKeys?: any;
            lineWrapping?: boolean;
            lineNumbers?: boolean;
            firstLineNumber?: number;
            lineNumberFormatter?: (line: number) => string;
            gutters?: string[];
            fixedGutter?: boolean;
            scrollbarStyle?: string;
            coverGutterNextToScrollbar?: boolean;
            inputStyle?: string;
            readOnly?: boolean | string;
            showCursorWhenSelecting?: boolean;
            lineWiseCopyCut?: boolean;
            pasteLinesPerSelection?: boolean;
            selectionsMayTouch?: boolean;
            cursorBlinkRate?: number;
            cursorScrollMargin?: number;
            cursorHeight?: number;
            workTime?: number;
            workDelay?: number;
            pollInterval?: number;
            flattenSpans?: boolean;
            addModeClass?: boolean;
            dragDrop?: boolean;
            allowDropFileTypes?: string[];
            cursorActivity?: () => void;
            viewportChange?: (from: number, to: number) => void;
            swapDoc?: (doc: Doc) => void;
            maxHighlightLength?: number;
            viewportMargin?: number;
            lint?: boolean | object;
            autoRefresh?: boolean;
            styleActiveLine?: boolean;
            autoCloseBrackets?: boolean;
            // Add other configuration options as needed
        }

        interface Position {
            line: number;
            ch: number;
            sticky?: string;
        }
    }
}