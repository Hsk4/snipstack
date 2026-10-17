"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh, Points } from "three";

const LIME = "#c6f26b";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Small seeded PRNG, so render stays pure (no Math.random during render)
function mulberry32(seed: number) {
    let s = seed;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function buildPositions(count: number) {
    const rand = mulberry32(42);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 2.2 + rand() * 2.2;
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
}

function Knot() {
    const group = useRef<Group>(null);
    const knot = useRef<Mesh>(null);

    useFrame((state, dt) => {
        if (!group.current || !knot.current) return;
        knot.current.rotation.x += dt * 0.25;
        knot.current.rotation.y += dt * 0.35;

        // gentle mouse parallax
        group.current.rotation.y = lerp(group.current.rotation.y, state.pointer.x * 0.5, 0.05);
        group.current.rotation.x = lerp(group.current.rotation.x, -state.pointer.y * 0.3, 0.05);
        group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    });

    return (
        <group ref={group}>
            <mesh ref={knot}>
                <torusKnotGeometry args={[1.1, 0.32, 180, 24]} />
                <meshBasicMaterial color={LIME} wireframe transparent opacity={0.35} />
            </mesh>
        </group>
    );
}

function Particles({ count = 500 }: { count?: number }) {
    const ref = useRef<Points>(null);
    const positions = useMemo(() => buildPositions(count), [count]);

    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.rotation.y += dt * 0.08;
        ref.current.rotation.x += dt * 0.03;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color={LIME} size={0.028} sizeAttenuation transparent opacity={0.8} />
        </points>
    );
}

export default function HeroScene() {
    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
        >
            <Knot />
            <Particles />
        </Canvas>
    );
}