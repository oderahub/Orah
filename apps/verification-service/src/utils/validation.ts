import { IoTDataPoint, ValidationResult, ValidationIssue } from '../types';

export class ValidationRules {
  private static readonly TEMP_MIN = parseFloat(process.env.TEMP_MIN || '-10');
  private static readonly TEMP_MAX = parseFloat(process.env.TEMP_MAX || '50');
  private static readonly HUMIDITY_MIN = parseFloat(process.env.HUMIDITY_MIN || '0');
  private static readonly HUMIDITY_MAX = parseFloat(process.env.HUMIDITY_MAX || '100');

  // Optional GPS bounds
  private static readonly LAT_MIN = process.env.LAT_MIN ? parseFloat(process.env.LAT_MIN) : -90;
  private static readonly LAT_MAX = process.env.LAT_MAX ? parseFloat(process.env.LAT_MAX) : 90;
  private static readonly LNG_MIN = process.env.LNG_MIN ? parseFloat(process.env.LNG_MIN) : -180;
  private static readonly LNG_MAX = process.env.LNG_MAX ? parseFloat(process.env.LNG_MAX) : 180;

  static validateIoTData(dataPoints: IoTDataPoint[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    let totalScore = 100;

    // Must have at least one data point
    if (!dataPoints || dataPoints.length === 0) {
      issues.push({
        severity: 'error',
        field: 'iotData',
        message: 'At least one IoT data point is required',
      });
      return {
        isValid: false,
        score: 0,
        issues,
        summary: 'No IoT data provided',
      };
    }

    // Validate each data point
    dataPoints.forEach((point, index) => {
      // Validate timestamp
      const timestampIssues = this.validateTimestamp(point.timestamp, index);
      issues.push(...timestampIssues);
      totalScore -= timestampIssues.filter(i => i.severity === 'error').length * 10;
      totalScore -= timestampIssues.filter(i => i.severity === 'warning').length * 5;

      // Validate temperature if provided
      if (point.temperature !== undefined) {
        const tempIssues = this.validateTemperature(point.temperature, index);
        issues.push(...tempIssues);
        totalScore -= tempIssues.filter(i => i.severity === 'error').length * 10;
        totalScore -= tempIssues.filter(i => i.severity === 'warning').length * 5;
      }

      // Validate humidity if provided
      if (point.humidity !== undefined) {
        const humidityIssues = this.validateHumidity(point.humidity, index);
        issues.push(...humidityIssues);
        totalScore -= humidityIssues.filter(i => i.severity === 'error').length * 10;
        totalScore -= humidityIssues.filter(i => i.severity === 'warning').length * 5;
      }

      // Validate location if provided
      if (point.location) {
        const locationIssues = this.validateLocation(point.location, index);
        issues.push(...locationIssues);
        totalScore -= locationIssues.filter(i => i.severity === 'error').length * 10;
        totalScore -= locationIssues.filter(i => i.severity === 'warning').length * 5;
      }
    });

    // Check for data consistency across multiple readings
    if (dataPoints.length > 1) {
      const consistencyIssues = this.validateConsistency(dataPoints);
      issues.push(...consistencyIssues);
      totalScore -= consistencyIssues.filter(i => i.severity === 'warning').length * 3;
    }

    // Ensure score is between 0 and 100
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine if valid (score must be >= 60 and no critical errors)
    const hasErrors = issues.some(i => i.severity === 'error');
    const isValid = !hasErrors && totalScore >= 60;

    return {
      isValid,
      score: totalScore,
      issues,
      summary: this.generateSummary(isValid, totalScore, issues),
    };
  }

  private static validateTimestamp(timestamp: string, index: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    try {
      const date = new Date(timestamp);

      // Check if valid date
      if (isNaN(date.getTime())) {
        issues.push({
          severity: 'error',
          field: `iotData[${index}].timestamp`,
          message: 'Invalid timestamp format. Use ISO 8601 format',
          value: timestamp,
        });
        return issues;
      }

      // Check if timestamp is in the future
      const now = new Date();
      if (date > now) {
        issues.push({
          severity: 'error',
          field: `iotData[${index}].timestamp`,
          message: 'Timestamp cannot be in the future',
          value: timestamp,
        });
      }

      // Warn if timestamp is too old (> 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (date < oneYearAgo) {
        issues.push({
          severity: 'warning',
          field: `iotData[${index}].timestamp`,
          message: 'Timestamp is more than 1 year old',
          value: timestamp,
        });
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].timestamp`,
        message: 'Failed to parse timestamp',
        value: timestamp,
      });
    }

    return issues;
  }

  private static validateTemperature(temperature: number, index: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (typeof temperature !== 'number' || isNaN(temperature)) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].temperature`,
        message: 'Temperature must be a valid number',
        value: temperature,
      });
      return issues;
    }

    if (temperature < this.TEMP_MIN || temperature > this.TEMP_MAX) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].temperature`,
        message: `Temperature must be between ${this.TEMP_MIN}°C and ${this.TEMP_MAX}°C`,
        value: temperature,
      });
    }

    // Warn for unusual but possible temperatures
    if (temperature < 0 || temperature > 40) {
      issues.push({
        severity: 'warning',
        field: `iotData[${index}].temperature`,
        message: 'Temperature is outside typical agricultural range (0-40°C)',
        value: temperature,
      });
    }

    return issues;
  }

  private static validateHumidity(humidity: number, index: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (typeof humidity !== 'number' || isNaN(humidity)) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].humidity`,
        message: 'Humidity must be a valid number',
        value: humidity,
      });
      return issues;
    }

    if (humidity < this.HUMIDITY_MIN || humidity > this.HUMIDITY_MAX) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].humidity`,
        message: `Humidity must be between ${this.HUMIDITY_MIN}% and ${this.HUMIDITY_MAX}%`,
        value: humidity,
      });
    }

    return issues;
  }

  private static validateLocation(
    location: { latitude: number; longitude: number },
    index: number
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate latitude
    if (typeof location.latitude !== 'number' || isNaN(location.latitude)) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].location.latitude`,
        message: 'Latitude must be a valid number',
        value: location.latitude,
      });
    } else if (location.latitude < -90 || location.latitude > 90) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].location.latitude`,
        message: 'Latitude must be between -90 and 90',
        value: location.latitude,
      });
    } else if (location.latitude < this.LAT_MIN || location.latitude > this.LAT_MAX) {
      issues.push({
        severity: 'warning',
        field: `iotData[${index}].location.latitude`,
        message: `Latitude is outside configured region (${this.LAT_MIN} to ${this.LAT_MAX})`,
        value: location.latitude,
      });
    }

    // Validate longitude
    if (typeof location.longitude !== 'number' || isNaN(location.longitude)) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].location.longitude`,
        message: 'Longitude must be a valid number',
        value: location.longitude,
      });
    } else if (location.longitude < -180 || location.longitude > 180) {
      issues.push({
        severity: 'error',
        field: `iotData[${index}].location.longitude`,
        message: 'Longitude must be between -180 and 180',
        value: location.longitude,
      });
    } else if (location.longitude < this.LNG_MIN || location.longitude > this.LNG_MAX) {
      issues.push({
        severity: 'warning',
        field: `iotData[${index}].location.longitude`,
        message: `Longitude is outside configured region (${this.LNG_MIN} to ${this.LNG_MAX})`,
        value: location.longitude,
      });
    }

    return issues;
  }

  private static validateConsistency(dataPoints: IoTDataPoint[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check timestamp order
    for (let i = 1; i < dataPoints.length; i++) {
      const prevDate = new Date(dataPoints[i - 1].timestamp);
      const currDate = new Date(dataPoints[i].timestamp);

      if (currDate < prevDate) {
        issues.push({
          severity: 'warning',
          field: 'iotData',
          message: `Data points are not in chronological order (index ${i})`,
        });
      }
    }

    // Check for duplicate timestamps
    const timestamps = dataPoints.map(p => p.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    if (timestamps.length !== uniqueTimestamps.size) {
      issues.push({
        severity: 'warning',
        field: 'iotData',
        message: 'Duplicate timestamps detected',
      });
    }

    // Check for extreme variations in temperature
    const temperatures = dataPoints
      .map(p => p.temperature)
      .filter((t): t is number => t !== undefined);

    if (temperatures.length > 1) {
      const maxTemp = Math.max(...temperatures);
      const minTemp = Math.min(...temperatures);
      const tempDiff = maxTemp - minTemp;

      if (tempDiff > 30) {
        issues.push({
          severity: 'warning',
          field: 'iotData',
          message: `Large temperature variation detected (${tempDiff.toFixed(1)}°C)`,
        });
      }
    }

    // Check for location consistency
    const locations = dataPoints
      .map(p => p.location)
      .filter((l): l is { latitude: number; longitude: number } => l !== undefined);

    if (locations.length > 1) {
      // Check if locations are too far apart (> 100km suggests movement)
      const firstLoc = locations[0];
      for (let i = 1; i < locations.length; i++) {
        const distance = this.calculateDistance(
          firstLoc.latitude,
          firstLoc.longitude,
          locations[i].latitude,
          locations[i].longitude
        );

        if (distance > 100) {
          issues.push({
            severity: 'warning',
            field: 'iotData',
            message: `Locations are more than 100km apart (${distance.toFixed(1)}km)`,
          });
          break;
        }
      }
    }

    return issues;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula for calculating distance between two GPS coordinates
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private static generateSummary(
    isValid: boolean,
    score: number,
    issues: ValidationIssue[]
  ): string {
    if (!isValid) {
      const errorCount = issues.filter(i => i.severity === 'error').length;
      return `Validation failed with ${errorCount} error(s). Score: ${score}/100`;
    }

    const warningCount = issues.filter(i => i.severity === 'warning').length;
    if (warningCount > 0) {
      return `Validation passed with ${warningCount} warning(s). Score: ${score}/100`;
    }

    return `Validation passed successfully. Score: ${score}/100`;
  }
}
