const React = require('react');

// This is a mock for all lucide-react icons.
// It creates a Proxy that will return a dummy React component for any requested icon.
// This avoids the ESM/CJS module resolution error during tests.
module.exports = new Proxy({}, {
    get: function (target, prop) {
        // Return a simple React component that renders an <svg> tag.
        // We pass through props so that className, etc. are applied.
        // The data-testid helps in identifying that a mock is being rendered.
        return (props) => React.createElement('svg', { ...props, 'data-testid': 'lucide-icon-mock' });
    }
});
