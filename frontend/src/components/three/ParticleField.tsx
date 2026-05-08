import * as THREE from 'three';
import { useEffect, useRef, memo } from 'react';

const ParticleField = memo(function ParticleField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // WebGL availability check
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      // Fallback: CSS gradient only
      if (mountRef.current) {
        mountRef.current.style.background =
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,255,136,0.1), transparent 70%)';
      }
      return;
    }

    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 400 : 1800;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = 50;

    // Instanced particles
    const geometry = new THREE.SphereGeometry(0.08, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.25,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);

    const dummy = new THREE.Object3D();
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005
        )
      );
    }
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    let animId: number;
    const position = new THREE.Vector3();
    const matrix = new THREE.Matrix4();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Mouse parallax (subtle)
      camera.position.x += (mouseX * 0.03 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.03 - camera.position.y) * 0.05;

      // Drift particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        mesh.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        position.add(velocities[i]);

        // Wrap around
        if (Math.abs(position.x) > 50) position.x *= -0.99;
        if (Math.abs(position.y) > 50) position.y *= -0.99;
        if (Math.abs(position.z) > 25) position.z *= -0.99;

        matrix.setPosition(position);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      mesh.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    const currentMount = mountRef.current;
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
});

export default ParticleField;
