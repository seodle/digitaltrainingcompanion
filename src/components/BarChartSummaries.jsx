/**
 * Main Function:
 * - The BarChartSummaries component is designed to render responsive bar charts using the Nivo bar chart library. It is highly configurable and meant for visualizing a wide array of data in an interactive and visually appealing manner. The component is versatile, supporting various configurations such as displaying different keys, indexing by specific attributes, and customizing axis labels for enhanced readability.
 * 
 * Frontend Operations:
 * - Leverages the useRef hook to manage the tick index, ensuring that axis tick labels are dynamically adjusted based on the data provided.
 * - Utilizes the useEffect hook to reset the tick index whenever the data changes, maintaining the consistency and accuracy of the visualization.
 * - Dynamically calculates left and right margins based on the presence of yAxisLabels and axisRightLabel to accommodate custom label content without clipping.
 * - Supports custom axis configurations, including tick values and formatting for the yAxisLabels, enabling the display of custom categorical labels on the y-axis.
 * - Implements a custom tooltip component to provide detailed information on hover, enhancing the interactivity and user experience of the chart.
 * - Provides a ZeroValueLayer to manage the display of bars with zero values, ensuring they are still visible and interactive within the chart.
 * - Incorporates a CustomTick component to customize the tick labels' appearance on the x-axis, allowing for more flexible label positioning and styling.
 * - Configures legends dynamically based on the 'legends' prop, allowing for the inclusion or exclusion of legends in the chart presentation.
 * - Adopts a layered approach to rendering the chart components, enabling the integration of custom layers like the ZeroValueLayer for specialized behavior.
 * 
 * Notable Features:
 * - The component is designed to be responsive, ensuring that the bar chart layout and rendering are optimized for different screen sizes and resolutions.
 * - Provides extensive customization options through props, including data keys, indexing attributes, axis labels, and legend configuration, making it suitable for a wide range of data visualization needs.
 * - Employs conditional rendering and configuration to support various visualization requirements, such as differentiating between yAxisLabels being present or not and adjusting margins accordingly.
 * - Enhances accessibility and user interaction through custom tooltips and the handling of zero values, ensuring that all data points are meaningful and informative to the user.
 * 
 * Note: This component is specifically tailored for visualizing educational or training assessment data but can be adapted for other data visualization needs due to its flexible design.
 */


import React, { useRef, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';

const BarChartSummaries = ({ data, keys, indexBy, axisLeftLabel, axisRightLabel="", yAxisLabels=[], legends=false }) => {
  
    const tickIndex = useRef(0);
    // Reset tick index when data changes
    useEffect(() => {
        tickIndex.current = 0;
    }, [data]);

    if (data.length === 0) {
        return;
    }

    const leftMargin = (yAxisLabels?.length > 0 ? 110 : 60);
    const rightMargin = axisRightLabel ? 60 : 20; 
    const axisLeftConfig = yAxisLabels.length > 0 ? {
        tickValues: yAxisLabels.map((_, index) => index),
        format: value => yAxisLabels[value],
        tickSize:5,
        tickPadding: 5,
        tickRotation: 0,
        legend: axisLeftLabel,
        legendPosition: 'middle',
    } : {
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: axisLeftLabel,
        legendPosition: 'middle',
        legendOffset: -40,
    };

    const axisRightConfig = axisRightLabel
        ? {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: axisRightLabel,
            legendPosition: 'middle',
            legendOffset: 40
        }
        : null;

    const responsiveBarLegends = legends ? [
        {
            dataFrom: 'keys',
            anchor: 'top-right',
            direction: 'row',
            justify: false,
            translateX: -80,
            translateY: -40,
            itemsSpacing: 70,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [{on: 'hover',style: {itemOpacity: 1}}]}] : [];

    // Utility function to split text into chunks of a maximum length
    const splitText = (text, maxLength) => {
        if (!text) return [];
        const regexPattern = new RegExp(`.{1,${maxLength}}(\\s|$)|\\S+?(\\s|$)`, 'g');
        return text.match(regexPattern) || [];
        };

    // Utility to manage the display of 0 values
    const ZeroValueLayer = ({ bars }) => {
        return bars.map((bar, i) => {
            if (bar.data.value === 0) {
            return (
                <rect
                key={i}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={Math.max(2, bar.height)}
                fill="transparent"
                onMouseEnter={(e) => {
                }}
                onMouseLeave={(e) => {
                }}
                />
            );
            }
            return null;
        });
    };

    // Define a custom tooltip component
    const CustomTooltip = ({ id, value, data }) => {
        const fullCompetencyChunks = splitText(data["Full Competency"], 50);
        const tooltipRef = useRef();
        const displayValue = value === 0.1 ? 0 : value;

        return (
            <div
            ref={tooltipRef}
            style={{
                padding: '12px',
                width: "200px",
                color: 'black',
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                border: '1px solid #ccc',
            }}
            >
            Assessed <strong>{data[id + " Count"]} times</strong><br/>
            {yAxisLabels.length === 0 && (
                <>
                    Score: <strong>{displayValue}%</strong><br/>
                </>
                
                )} 
            {fullCompetencyChunks.map((chunk, index) => (
                    <span key={index}>
                    {chunk}
                    <br />
                    </span>
                ))}
        </div>
        );
    };

    const CustomTick = (tick) => {
        let yOffset;
        switch (tickIndex.current % 3) {
            case 0:
                yOffset = 20;
                break;
            case 1:
                yOffset = 35;
                break;
            case 2:
                yOffset = 50;
                break;
            default:
                yOffset = 20;
        }
        tickIndex.current += 1;

        return (
            <g transform={`translate(${tick.x},${tick.y + yOffset})`}>
                <text
                    textAnchor="middle"
                    style={{
                        fill: '#333',
                        fontSize: '10px'
                    }}
                >
                    {tick.value}
                </text>
            </g>
        );
    };

return (

    <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 50, right: rightMargin, bottom: 100, left: leftMargin }}
        padding={0.3}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={['rgb(182, 215, 228)', 'rgb(255, 127, 80)', 'rgb(244, 187,68)']}
        axisLeft={axisLeftConfig}
        axisRight={axisRightConfig}
        axisBottom={{
            tickSize: 5,
            tickPadding: 70,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: 32,
            truncateTickAt: 0,
            renderTick: CustomTick
        }}
        enableGridY={false}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
            from: 'color',
            modifiers: [
                [
                    'darker',
                    1.6
                ]
            ]
        }}
        legends={responsiveBarLegends}
        
        role="application"
        ariaLabel=""
        tooltip={({ id, value, color, data }) => <CustomTooltip id={id} value={value} color={color} data={data} />}
        layers={['grid', 'axes', 'bars', ZeroValueLayer, 'markers', 'legends']}

    />
  );
}

export default BarChartSummaries;
