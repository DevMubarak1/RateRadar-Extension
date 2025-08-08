// Simple Chart Library for RateRadar Extension
class SimpleChart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            type: 'line',
            data: { labels: [], datasets: [] },
            ...options
        };
        this.render();
    }

    render() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        if (this.options.type === 'line') {
            this.renderLineChart();
        }
    }

    renderLineChart() {
        const { labels, datasets } = this.options.data;
        if (!labels.length || !datasets.length) return;

        const dataset = datasets[0];
        const values = dataset.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 20;

        // Find min/max values
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        // Calculate scales
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const xStep = chartWidth / (values.length - 1);
        const yScale = chartHeight / range;

        // Draw grid
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i * chartHeight / 4);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
        }

        // Draw line
        this.ctx.strokeStyle = dataset.borderColor || 'rgba(59, 130, 246, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        values.forEach((value, index) => {
            const x = padding + (index * xStep);
            const y = height - padding - ((value - minValue) * yScale);
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // Draw points
        this.ctx.fillStyle = dataset.pointBackgroundColor || 'rgba(59, 130, 246, 0.9)';
        this.ctx.strokeStyle = dataset.pointBorderColor || 'rgba(59, 130, 246, 1)';
        this.ctx.lineWidth = 1;

        values.forEach((value, index) => {
            const x = padding + (index * xStep);
            const y = height - padding - ((value - minValue) * yScale);
            const radius = 2;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });

        // Draw labels
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.font = '8px Arial';
        this.ctx.textAlign = 'center';

        labels.forEach((label, index) => {
            if (index % Math.ceil(labels.length / 4) === 0) {
                const x = padding + (index * xStep);
                const y = height - 5;
                this.ctx.fillText(label, x, y);
            }
        });
    }

    destroy() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Global Chart constructor for compatibility
window.Chart = SimpleChart; 