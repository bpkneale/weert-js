/*
 * Added by bpkneale
 */

import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import Table from 'react-bootstrap/lib/Table';
import * as units from '../units';
import * as utility from '../utility';

/*
 * Place holder for a table holding statistics
 */
export default class CrossWind extends React.Component {
    render() {
        const {windSpeed, windDirection, runway, componentClass: Component} = this.props;

        // Extract the unit system in use
        // let unitSystem = utility.getNested(['unit_system', 'max', 'value'], statsData);
        // // Make sure the min and max unit_system match. Otherwise, the database uses mixed unit systems
        // // and we don't know how to deal with that.
        // if (unitSystem === null || unitSystem !== utility.getNested(['unit_system', 'min', 'value'], statsData)) {
        //     unitSystem = undefined;
        // }
        const runwayDirection = runway * 10;
        let crosswind = undefined;
        let headOrTailwind = undefined;

        if(windSpeed !== undefined && windDirection !== undefined) {
            crosswind = Math.sin((runwayDirection - windDirection) * (Math.PI / 180)) * windSpeed;
            headOrTailwind = Math.cos((runwayDirection - windDirection) * (Math.PI / 180)) * windSpeed;
        }

        return (
            <div style={{minWidth: "260px"}}>
                <h2>Runway {runway.toString()}</h2>
                {crosswind !== undefined && headOrTailwind !== undefined ? 
                <ul>
                    <li>Wind Direction: {windDirection.toFixed(0)}°</li>
                    <li>Crosswind: {crosswind.toFixed(1)} knots</li>
                    <li>{headOrTailwind > 0 ? "Headwind" : "Tailwind"}: {Math.abs(headOrTailwind).toFixed(1)} knots</li>
                </ul>
                : <p>No data</p> }
            </div>
        );
    }
}