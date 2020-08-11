import { gsap } from 'gsap';
import { map, lerp, calcWinsize, getMousePos, getPageYScroll } from './utils';
import { EventEmitter } from 'events';

// Calculate the viewport size
let winsize = calcWinsize();
window.addEventListener('resize', () => {
    winsize = calcWinsize();
});

// Get the scroll Y position
let docYScroll = getPageYScroll();
window.addEventListener("scroll", () => {
    docYScroll = getPageYScroll();
});

// Track the mouse position
let mouse = {x: 0, y: 0};
window.addEventListener('mousemove', ev => mouse = getMousePos(ev));

export default class Cursor extends EventEmitter {
    constructor(el) {
        super();
        this.DOM = {el: el};
        this.DOM.el.style.opacity = 0;
        this.DOM.circleInner = this.DOM.el.querySelector('.cursor__inner');
        
        this.filterId = '#filter-1';
        this.DOM.feDisplacementMap = document.querySelector(`${this.filterId} > feDisplacementMap`);
        
        this.primitiveValues = {scale: 0};

        this.createTimeline();

        this.bounds = this.DOM.el.getBoundingClientRect();
        
        this.renderedStyles = {
            tx: {previous: 0, current: 0, amt: 0.14},
            ty: {previous: 0, current: 0, amt: 0.14},
            radius: {previous: 50, current: 50, amt: 0.14}
        };

        this.listen();

        this.onMouseMoveEv = () => {
            this.renderedStyles.tx.previous = this.renderedStyles.tx.current = mouse.x - this.bounds.width/2;
            this.renderedStyles.ty.previous = this.renderedStyles.ty.previous = mouse.y - this.bounds.height/2 - docYScroll;
            gsap.to(this.DOM.el, {duration: 0.9, ease: 'Power3.easeOut', opacity: 1});
            requestAnimationFrame(() => this.render());
            window.removeEventListener('mousemove', this.onMouseMoveEv);
        };
        window.addEventListener('mousemove', this.onMouseMoveEv);
    }
    render() {
        this.renderedStyles['tx'].current = mouse.x - this.bounds.width/2;
        this.renderedStyles['ty'].current = mouse.y - this.bounds.height/2 - docYScroll;

        for (const key in this.renderedStyles ) {
            this.renderedStyles[key].previous = lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].amt);
        }
                    
        this.DOM.el.style.transform = `translateX(${(this.renderedStyles['tx'].previous)}px) translateY(${this.renderedStyles['ty'].previous}px)`;
        this.DOM.circleInner.setAttribute('r', this.renderedStyles['radius'].previous);

        requestAnimationFrame(() => this.render());
    }
    createTimeline() {
        // init timeline
        this.tl = gsap.timeline({
            paused: true,
            onStart: () => {
                this.DOM.circleInner.style.filter = `url(${this.filterId}`;
            },
            onUpdate: () => {
                this.DOM.feDisplacementMap.scale.baseVal = this.primitiveValues.scale;
            },
            onComplete: () => {
                this.DOM.circleInner.style.filter = 'none';
            }
        })
        .to(this.primitiveValues, { 
            duration: 0.1,
            ease: 'Expo.easeOut',
            startAt: {scale: 0},
            scale: 60
        })
        .to(this.primitiveValues, { 
            duration: 0.6,
            ease: 'Power3.easeOut',
            scale: 0
        });
    }
    enter() {
        this.renderedStyles['radius'].current = 120;
        this.tl.restart();
    }
    leave() {
        this.renderedStyles['radius'].current = 50;
        this.tl.progress(1).kill();
    }
    listen() {
        this.on('enter', () => this.enter());
        this.on('leave', () => this.leave());
    }
}