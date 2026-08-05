const S = 50;
const CYCLE = 2.2;

type FaceConfig = {
	name: string;
	group: 'A' | 'B';
	style: React.CSSProperties;
	wrapStyle?: React.CSSProperties;
};

const FACES: FaceConfig[] = [
	{ name: 'front', group: 'B', style: { transform: `translateZ(${ S / 2 }px)` } },
	{ name: 'back', group: 'A', style: { transform: `translateZ(${ -S / 2 }px) rotateY(180deg)` } },
	{ name: 'left', group: 'B', style: { transform: `translateX(${ -S / 2 }px) rotateY(-90deg)` }, wrapStyle: { transform: 'rotateZ(90deg)' } },
	{ name: 'right', group: 'A', style: { transform: `translateX(${ S / 2 }px) rotateY(90deg)` }, wrapStyle: { transform: 'rotateZ(-90deg)' } },
	{ name: 'top', group: 'B', style: { transform: `translateY(${ -S / 2 }px) rotateX(90deg)` }, wrapStyle: { transform: 'rotateZ(-90deg)' } },
	{ name: 'bottom', group: 'A', style: { transform: `translateY(${ S / 2 }px) rotateX(-90deg)` }, wrapStyle: { transform: 'rotateZ(-90deg)' } },
];

const KEYFRAMES = `
@keyframes cubeLoaderGroupA {
	0%, 2%   { transform: scaleY(0); opacity: 0;   background-color: #ED213A; transform-origin: center bottom; }
	22%      { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center bottom; }
	54.9%    { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center bottom; }
	55%      { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center top; }
	75%      { transform: scaleY(0); opacity: 0;    background-color: #0780ba; transform-origin: center top; }
	100%     { transform: scaleY(0); opacity: 0;    transform-origin: center bottom; }
}
@keyframes cubeLoaderGroupB {
	0%, 2%   { transform: scaleY(0); opacity: 0;   background-color: #ED213A; transform-origin: center bottom; }
	25%      { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center bottom; }
	29.9%    { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center bottom; }
	30%      { transform: scaleY(1); opacity: 0.9;  background-color: #c7eafd; transform-origin: center top; }
	54%      { transform: scaleY(0); opacity: 0;    background-color: #0780ba; transform-origin: center top; }
	100%     { transform: scaleY(0); opacity: 0;    transform-origin: center bottom; }
}
`;

export const FullPageLoader = () => (
	<>
		<style>{ KEYFRAMES }</style>
		<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } }>
			<div style={ { transformStyle: 'preserve-3d', transform: 'rotateX(-35deg) rotateY(45deg)' } }>
				<div style={ { position: 'relative', width: S, height: S, transformStyle: 'preserve-3d' } }>
					{ FACES.map((face) => (
						<div
							key={ face.name }
							style={ { position: 'absolute', left: 0, top: 0, width: S, height: S, ...face.style } }
						>
							<div style={ { display: 'flex', justifyContent: 'space-around', width: '100%', height: '100%', ...face.wrapStyle } }>
								{ Array.from({ length: 5 }, (_, i) => (
									<div
										key={ i }
										style={ {
											flex: '1 0 auto',
											width: '20%',
											transform: 'scaleY(0)',
											opacity: 0,
											boxShadow: '0px 0px 40px rgba(199,234,253,0.3)',
											animation: `cubeLoaderGroup${ face.group } ${ CYCLE }s cubic-bezier(0.37,0,0.63,1) infinite`,
											animationDelay: `${ (face.group === 'A' ? 0 : 0.3) + i * 0.1 }s`,
										} }
									/>
								)) }
							</div>
						</div>
					)) }
				</div>
			</div>
		</div>
	</>
);