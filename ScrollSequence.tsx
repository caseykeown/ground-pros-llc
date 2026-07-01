import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll-driven JPG frame sequence.
 * - Scroll happens inside the component (not the window).
 * - The current frame updates instantly to match scroll position.
 * - The image overlays the internal scroll area and always fills the component.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollSequence(props) {
    const { images, frameHeight, style } = props

    const scrollRef = useRef(null)
    const lastFrame = useRef(-1)
    const ticking = useRef(false)
    const [frame, setFrame] = useState(0)

    const count = images.length

    // Preload every frame into the browser cache so src swaps are instant.
    useEffect(() => {
        lastFrame.current = -1
        setFrame(0)
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        const preloaded = images.map((src) => {
            const img = new Image()
            img.src = src
            return img
        })
        return () => {
            preloaded.forEach((img) => {
                img.onload = null
                img.onerror = null
            })
        }
    }, [images])

    const update = () => {
        ticking.current = false
        const el = scrollRef.current
        if (!el || count === 0) return
        const max = el.scrollHeight - el.clientHeight
        const progress = max > 0 ? el.scrollTop / max : 0
        const idx = Math.min(
            count - 1,
            Math.max(0, Math.round(progress * (count - 1)))
        )
        if (idx !== lastFrame.current) {
            lastFrame.current = idx
            setFrame(idx)
        }
    }

    const onScroll = () => {
        if (ticking.current) return
        ticking.current = true
        requestAnimationFrame(update)
    }

    // Total internal scroll distance = frameHeight per frame.
    const trackHeight = frameHeight * Math.max(count, 1)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000",
                ...style,
            }}
        >
            <style>{`.ssq-scroll::-webkit-scrollbar{display:none}`}</style>

            {/* Internal scroll layer. Sits under the image; captures wheel/touch. */}
            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="ssq-scroll"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowY: "scroll",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    zIndex: 1,
                }}
            >
                <div style={{ width: "100%", height: trackHeight }} />
            </div>

            {/* Image overlay. Fills the component; pointerEvents none lets scroll pass through. */}
            {count > 0 && (
                <img
                    src={images[frame]}
                    alt=""
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 2,
                    }}
                />
            )}

            {count === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        font: "500 13px/1.4 sans-serif",
                        textAlign: "center",
                        padding: 16,
                        pointerEvents: "none",
                    }}
                >
                    Add JPG frames in the Images property
                </div>
            )}
        </div>
    )
}

ScrollSequence.defaultProps = {
    images: [],
    frameHeight: 40,
}

addPropertyControls(ScrollSequence, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 65,
        control: { type: ControlType.Image },
        defaultValue: [],
    },
    frameHeight: {
        type: ControlType.Number,
        title: "Frame Height",
        defaultValue: 40,
        min: 1,
        max: 2000,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
})
