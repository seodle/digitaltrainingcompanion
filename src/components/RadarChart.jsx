import { ResponsiveRadar } from '@nivo/radar'
import { mockRadarData as data} from "../data/mockData";

const RadarChart = ({keys}) => {

  return (
    <ResponsiveRadar
        data={data}
        keys={keys}

        //keys={[ 'Problem solving', 'Information and data literacy', 'Communication and collaboration', 'Digital content creation', 'Safety' ]}
        indexBy="area"
        valueFormat=">-.0f"
        margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
        borderColor={{ from: 'color' }}
        gridLabelOffset={36}
        dotSize={10}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        colors={{ scheme: "nivo" }}
        blendMode="multiply"
        motionConfig="wobbly"
        enableDotLabel={true}


    />
  );
};

export default RadarChart;
