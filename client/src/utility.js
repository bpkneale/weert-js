/*
 * Copyright (c) 2016-2018 Tom Keffer <tkeffer@gmail.com>
 *
 * See the file LICENSE for your full rights.
 */

import sortedIndexBy from "lodash/sortedIndexBy";
import * as unitConfig from "../config/unitConfig";

export function findFirstGood(packets, maxAge) {
  if (packets.length && maxAge !== undefined) {
    // First, find the first packet less than maxAge old
    const trimTime = Date.now() - maxAge;
    const firstRecent = packets.findIndex(packet => {
      return packet.timestamp >= trimTime;
    });

    // If there was no good packet, skip them all. Otherwise, just
    // up to the first good packet
    return firstRecent === -1 ? packets.length : firstRecent;
  } else {
    return 0;
  }
}

export function insertSorted(packets, packet, maxAge) {
  // Find the first packet we are going to keep:
  const firstGood = findFirstGood(packets, maxAge);
  // Find the insertion point
  const insertPoint = sortedIndexBy(packets, packet, p => p.timestamp);
  // Drop the stale packets at the front, keep the other packets, inserting
  // the new packet in the proper spot.
  return [
    ...packets.slice(firstGood, insertPoint),
    packet,
    ...packets.slice(insertPoint)
  ];
}

export function isDevelopment() {
  return !process.env.NODE_ENV || process.env.NODE_ENV === "development";
}

export function isSame(option1, option2) {
  return (
    option1.maxAge === option2.maxAge &&
    option1.aggregation === option2.aggregation
  );
}

// Access a deeply nested value, with thanks to A. Sharif (https://goo.gl/f924sP)
export function getNested(path, obj) {
  return path.reduce(
    (xs, x) => (xs != null && xs[x] != null ? xs[x] : undefined),
    obj
  );
}

// Extract the top-level, non-object key-value pairs from an object.
export function getOptions(obj) {
  return Object.keys(obj).reduce((options, k) => {
    if (typeof obj[k] !== "object") {
      options[k] = obj[k];
    }
    return options;
  }, {});
}

// Perform a fetch, but with a timeout. Thanks to David Walsh (https://goo.gl/SFoSvW)
export function fetchWithTimeout(url, timeout) {
  if (timeout == null) timeout = 5000;
  let didTimeOut = false;

  return new Promise(function(resolve, reject) {
    const timeout = setTimeout(function() {
      didTimeOut = true;
      reject(new Error("Fetch request timed out"));
    }, timeout);

    fetch(url)
      .then(function(response) {
        // Clear the timeout as cleanup
        clearTimeout(timeout);
        // It's possible that the timeout occurred, and then a late response
        // came in. In this case, didTimeOut will be true and we need to ignore the response.
        // Otherwise, this is the response we're looking for.
        if (!didTimeOut) {
          resolve(response);
        }
      })
      .catch(function(err) {
        // Rejection already happened with setTimeout
        if (didTimeOut) return;
        // Reject with error
        reject(err);
      });
  });
}

function f_to_c(f) {
  return f === undefined ? undefined : (parseFloat(f) - 32) * 5 / 9 ;
}

function mph_to_knots(mph) {
  return mph === undefined ? undefined : mph / 1.151;
}

function inHg_to_mbar(inHg) {
  return inHg === undefined ? undefined : inHg * 33.864;
}

export function convertPacketToUnit(packet, targetUnit) {

  if(targetUnit === unitConfig.unitSystem_Metric) {
    packet.altimeter_pressure = inHg_to_mbar(packet.altimeter_pressure);
    packet.console_voltage = packet.console_voltage;
    packet.dewpoint_temperature = f_to_c(packet.dewpoint_temperature);
    packet.gauge_pressure = inHg_to_mbar(packet.gauge_pressure);
    packet.heatindex_temperature = f_to_c(packet.heatindex_temperature);
    packet.in_humidity_percent = packet.in_humidity_percent;
    packet.in_temperature = f_to_c(packet.in_temperature);
    packet.out_humidity_percent = packet.out_humidity_percent;
    packet.out_temperature = f_to_c(packet.out_temperature);
    packet.rain_rain = packet.rain_rain;
    packet.sealevel_pressure = inHg_to_mbar(packet.sealevel_pressure);
    packet.unit_system = 0x10;
    packet.wind_dir = packet.wind_dir;
    packet.wind_speed = mph_to_knots(packet.wind_speed);
    packet.windchill_temperature = f_to_c(packet.windchill_temperature);
    packet.x_wind_speed = mph_to_knots(packet.x_wind_speed);
    packet.y_wind_speed = mph_to_knots(packet.y_wind_speed);
  }
}

export function convertStatsToUnit(stats, targetUnit) {

  if(targetUnit === unitConfig.unitSystem_Metric) {
    let min_pkt = {};
    let max_pkt = {};
    for(const key in stats) {
      if(stats[key].min !== undefined) {
        min_pkt[key] = stats[key].min.value;
      }
      if(stats[key].max !== undefined) {
        max_pkt[key] = stats[key].max.value;
      }
    }
    convertPacketToUnit(min_pkt, targetUnit);
    convertPacketToUnit(max_pkt, targetUnit);
    for(const key in stats) {
      if(min_pkt[key] !== undefined) {
        stats[key].min.value = min_pkt[key];
      }
      if(max_pkt[key] !== undefined) {
        stats[key].max.value = max_pkt[key];
      }
    }
  }

}
