import browser from 'webextension-polyfill';
import * as defaults from './defaults.js';

const ICON_SIZE = 38;

const cornerPositions = {
	'top-left': {x: 0, textAlign: 'left', y: 0},
	'bottom-right': {x: ICON_SIZE, textAlign: 'right', y: ICON_SIZE}
};

const ACCOUNT_COLORS = [
	[3, 102, 214, 255], // Blue
	[219, 55, 0, 255], // Red-orange
	[46, 164, 79, 255], // Green
	[111, 66, 193, 255], // Purple
	[227, 98, 9, 255], // Orange
	[191, 135, 0, 255], // Gold
	[3, 47, 98, 255], // Dark blue
	[150, 56, 138, 255] // Magenta
];

const ACCOUNT_MARKERS = [
	'\uD83D\uDD35', // Blue circle
	'\uD83D\uDD34', // Red circle
	'\uD83D\uDFE2', // Green circle
	'\uD83D\uDFE3', // Purple circle
	'\uD83D\uDFE0', // Orange circle
	'\uD83D\uDFE1', // Yellow circle
	'\u26AB', // Black circle
	'\u26AA' // White circle
];

function getCountString(count) {
	if (count === 0) {
		return '';
	}

	if (count > 99) {
		return 'C';
	}

	return String(count);
}

function getErrorData(error) {
	const title = defaults.getErrorTitle(error);
	const symbol = defaults.getErrorSymbol(error);
	return {symbol, title};
}

const FONT_SIZE = 19;

function drawBadgePill(context, text, color, position) {
	context.font = `bold ${FONT_SIZE}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
	const metrics = context.measureText(text);
	const textWidth = metrics.width;
	const pillHeight = FONT_SIZE + 3;
	const pillWidth = Math.max(textWidth + 6, pillHeight);
	const radius = pillHeight / 2;

	const {x, textAlign, y} = cornerPositions[position];

	// Calculate pill position based on alignment
	const pillX = textAlign === 'right' ? x - pillWidth - 1 : x + 1;

	// Top corners: y is top edge; bottom corners: y is bottom edge
	const pillY = y < ICON_SIZE / 2 ? y : y - pillHeight;

	// Draw rounded rectangle background
	context.beginPath();
	context.moveTo(pillX + radius, pillY);
	context.lineTo(pillX + pillWidth - radius, pillY);
	context.arcTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + radius, radius);
	context.arcTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - radius, pillY + pillHeight, radius);
	context.lineTo(pillX + radius, pillY + pillHeight);
	context.arcTo(pillX, pillY + pillHeight, pillX, pillY + radius, radius);
	context.arcTo(pillX, pillY, pillX + radius, pillY, radius);
	context.closePath();

	context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] || 255) / 255})`;
	context.fill();

	// Draw text centered in pill
	context.fillStyle = 'white';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(text, pillX + (pillWidth / 2), pillY + (pillHeight / 2) + 1);
}

// Base toolbar icon embedded as data URL to avoid fetch issues in Service Workers
const BASE_ICON_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAMAAACf4xmcAAAATlBMVEUAAAD///////////////////////////////8AAAAPDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+/////QUKq7AAAACXRSTlMAECBQYJCg0PANY2drAAABgUlEQVQ4y42U26KFEBCGOyqiFa0w7/+ie5AitXb/VeVrZsypqhLVHRnAayBdXd2rIZCJNI+Qlh+B+kjtwcJiOwKYhdFDbDEAY5tTPYCV9KLFAvQphQ71RAtN6JpktlZ6J7Ym9tonCoXcHl8zgmZPGNMw1ntg1scllUgBrpSPz4bwGoBwR7zXxichUfM0bZg3/1kCNN6YCb9DIe7denN1NHaD0WiurjqAPWPbldq9TAAd+tThbS6tLeFEo9cBVHgxJWbDiYKhiv9wuNEcaguAmIjPpcLlRILJd9j8DruNTSSY/O+mGA8mZKVPwcnYTMNZUqqvVGwvg+k9i8W+ObWxpFhYelcG6VixHgHa9Wg+5UrvupK5fHzo3jZHC9H4hZxtKcPRGox9T2xvSzd9jtis8C2dtlrIJ4kjY9g1v4dLE0fGDaC7O/9qvV0wHCxok3GOOcoxR/XZcjC8xLjJloO3B4rlGMOE5asmLC5MqYoYPtpyceEgXnalE7lbrK+W6u8V/QePBE5p53JnkwAAAABJRU5ErkJggg==';

let baseIconBitmap = null;

async function getBaseIcon() {
	if (baseIconBitmap) {
		return baseIconBitmap;
	}

	const response = await fetch(BASE_ICON_DATA);
	const blob = await response.blob();
	baseIconBitmap = await createImageBitmap(blob);
	return baseIconBitmap;
}

// Cache last rendered state to skip no-op re-renders
let lastBadgeKey = null;

export async function renderMultiCount(badgeItems, allItems) {
	const badgeKey = badgeItems.length === 0 ? 'clear' : badgeItems.map(i => `${i.position}:${i.count}:${i.colorIndex}`).join(',');
	if (badgeKey === lastBadgeKey) {
		return;
	}

	lastBadgeKey = badgeKey;

	const tooltipItems = allItems || badgeItems;
	const tooltipParts = [];
	for (const item of tooltipItems) {
		const marker = ACCOUNT_MARKERS[item.colorIndex] || '\u26AB';
		tooltipParts.push(`${marker} ${item.name}: ${item.count}`);
	}

	const title = tooltipParts.length > 0 ?
		`${defaults.defaultTitle}\n${tooltipParts.join('\n')}` :
		defaults.defaultTitle;

	// Single instance: use native badge text for best readability
	if (badgeItems.length <= 1) {
		await browser.action.setIcon({path: 'icon-toolbar.png'});
		const item = badgeItems[0];
		const text = item ? getCountString(item.count) : '';
		const color = item?.color || defaults.getBadgeDefaultColor();
		browser.action.setBadgeText({text});
		browser.action.setBadgeBackgroundColor({color});
		browser.action.setTitle({title});
		return;
	}

	// Bottom-right uses native setBadgeText for best readability;
	// remaining corners are drawn on canvas
	const nativeItem = badgeItems.find(i => i.position === 'bottom-right');
	const canvasItems = badgeItems.filter(i => i.position !== 'bottom-right');

	const canvas = new OffscreenCanvas(ICON_SIZE, ICON_SIZE);
	const context = canvas.getContext('2d');

	const baseIcon = await getBaseIcon();
	context.drawImage(baseIcon, 0, 0, ICON_SIZE, ICON_SIZE);

	for (const item of canvasItems) {
		const text = getCountString(item.count);
		if (text) {
			const color = item.color || defaults.getBadgeDefaultColor();
			drawBadgePill(context, text, color, item.position);
		}
	}

	const imageData = context.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
	await browser.action.setIcon({imageData: {[ICON_SIZE]: imageData}});

	const nativeText = nativeItem ? getCountString(nativeItem.count) : '';
	const nativeColor = nativeItem?.color || defaults.getBadgeDefaultColor();
	browser.action.setBadgeText({text: nativeText});
	browser.action.setBadgeBackgroundColor({color: nativeColor});
	browser.action.setTitle({title});
}

function renderBadgeText(text, color, title) {
	lastBadgeKey = '';
	browser.action.setBadgeText({text});
	browser.action.setBadgeBackgroundColor({color});
	browser.action.setTitle({title});
}

export function renderError(error) {
	const color = defaults.getBadgeErrorColor();
	const {symbol, title} = getErrorData(error);
	renderBadgeText(symbol, color, title);
}

export function renderWarning(warning) {
	const color = defaults.getBadgeWarningColor();
	const title = defaults.getWarningTitle(warning);
	const symbol = defaults.getWarningSymbol(warning);
	renderBadgeText(symbol, color, title);
}

export async function renderClear() {
	return renderMultiCount([], []);
}

export function getAccountColor(index) {
	return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}

export function getAccountColorCss(index) {
	const c = getAccountColor(index);
	return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
