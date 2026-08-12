/**
 * A parser for the advanced filter's custom expression, e.g. `"(1 AND 2) OR 3"`, where each number
 * refers to a rule by its 1-based position.
 *
 * Grammar, lowest precedence first:
 *
 *     expression := term (OR term)*
 *     term       := factor (AND factor)*
 *     factor     := NUMBER | '(' expression ')'
 */

export type ExpressionErrorCode =
	| 'invalidChars'
	| 'unbalancedParentheses'
	| 'unknownRule'
	| 'malformed';

export type ExpressionNode =
	| { kind: 'rule'; index: number }
	| { kind: 'and' | 'or'; left: ExpressionNode; right: ExpressionNode };

export type ParseResult =
	| { ok: true; node: ExpressionNode }
	| { ok: false; error: ExpressionErrorCode };


/* ── Tokens ──────────────────────────────────────────────────────────────── */

type Token =
	| { type: 'number'; value: number }
	| { type: 'and' | 'or' | '(' | ')' };

/** Both spellings are accepted: the rule-logic buttons say ORAZ/LUB, the placeholder shows them. */
const KEYWORDS: Record<string, 'and' | 'or'> = {
	AND: 'and',
	ORAZ: 'and',
	OR: 'or',
	LUB: 'or',
};

function tokenise(input: string): Token[] | ExpressionErrorCode {
	const tokens: Token[] = [];
	let i = 0;

	while (i < input.length) {
		const char = input[i];

		if (/\s/.test(char)) {
			i++;
			continue;
		}

		if (char === '(' || char === ')') {
			tokens.push({ type: char });
			i++;
			continue;
		}

		if (/[0-9]/.test(char)) {
			let digits = '';
			while (i < input.length && /[0-9]/.test(input[i])) {
				digits += input[i];
				i++;
			}
			tokens.push({ type: 'number', value: Number(digits) });
			continue;
		}

		if (/[a-zA-Z]/.test(char)) {
			let word = '';
			while (i < input.length && /[a-zA-Z]/.test(input[i])) {
				word += input[i];
				i++;
			}

			const keyword = KEYWORDS[word.toUpperCase()];
			if (keyword === undefined) {
				return 'invalidChars';
			}

			tokens.push({ type: keyword });
			continue;
		}

		return 'invalidChars';
	}

	return tokens;
}


/* ── Parser ──────────────────────────────────────────────────────────────── */

/**
 * Parses `input` against `ruleCount` rules.
 */
export function parseExpression(input: string, ruleCount: number): ParseResult {
	const tokens = tokenise(input);

	if (!Array.isArray(tokens)) {
		return { ok: false, error: tokens };
	}

	if (tokens.length === 0) {
		return { ok: false, error: 'malformed' };
	}

	let position = 0;
	let failure: ExpressionErrorCode | null = null;

	const fail = (error: ExpressionErrorCode): null => {
		// Keep the first failure: it is the one nearest the actual mistake.
		failure ??= error;
		return null;
	};

	const peek = (): Token | undefined => tokens[position];

	const parseFactor = (): ExpressionNode | null => {
		const token = peek();

		if (token === undefined) {
			return fail('malformed');
		}

		if (token.type === 'number') {
			position++;

			if (token.value < 1 || token.value > ruleCount) {
				return fail('unknownRule');
			}

			return { kind: 'rule', index: token.value - 1 };
		}

		if (token.type === '(') {
			position++;
			const inner = parseExpressionNode();

			if (inner === null) {
				return null;
			}

			if (peek()?.type !== ')') {
				return fail('unbalancedParentheses');
			}

			position++;
			return inner;
		}

		// A closing paren or an operator where a value belongs.
		return fail(token.type === ')' ? 'unbalancedParentheses' : 'malformed');
	};

	const parseTerm = (): ExpressionNode | null => {
		let left = parseFactor();

		while (left !== null && peek()?.type === 'and') {
			position++;
			const right = parseFactor();

			if (right === null) {
				return null;
			}

			left = { kind: 'and', left, right };
		}

		return left;
	};

	const parseExpressionNode = (): ExpressionNode | null => {
		let left = parseTerm();

		while (left !== null && peek()?.type === 'or') {
			position++;
			const right = parseTerm();

			if (right === null) {
				return null;
			}

			left = { kind: 'or', left, right };
		}

		return left;
	};

	const node = parseExpressionNode();

	if (node === null) {
		return { ok: false, error: failure ?? 'malformed' };
	}

	if (position < tokens.length) {
		// Trailing tokens the grammar could not consume, e.g. "1 2" or "1)".
		return { ok: false, error: peek()?.type === ')' ? 'unbalancedParentheses' : 'malformed' };
	}

	return { ok: true, node };
}


/** Walks a parsed tree against one row's per-rule results. */
export function evaluateExpressionNode(node: ExpressionNode, ruleResults: boolean[]): boolean {
	switch (node.kind) {
		case 'rule':
			return ruleResults[node.index] ?? false;
		case 'and':
			return evaluateExpressionNode(node.left, ruleResults) && evaluateExpressionNode(node.right, ruleResults);
		case 'or':
			return evaluateExpressionNode(node.left, ruleResults) || evaluateExpressionNode(node.right, ruleResults);
	}
}

/**
 * Validates what the user has typed so far.
 * Returns `null` when the expression is usable - including when it is empty, which just means the rules' own AND/OR connectors apply.
 */
export function validateExpression(input: string, ruleCount: number): ExpressionErrorCode | null {
	if (input.trim() === '') {
		return null;
	}

	const result = parseExpression(input, ruleCount);

	return result.ok ? null : result.error;
}
