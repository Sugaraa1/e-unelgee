import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  subtext,
}) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={styles.header}>
      <Text style={styles.label}>{label}</Text>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.value}>{value}</Text>
    {subtext && <Text style={styles.subtext}>{subtext}</Text>}
  </View>
);

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'medium',
}) => {
  const colors = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#F44336',
  };

  const sizes = {
    small: 8,
    medium: 10,
    large: 12,
  };

  return (
    <View
      style={[
        styles.riskBadge,
        {
          backgroundColor: colors[level],
          width: sizes[size] * 2.5,
          height: sizes[size] * 2.5,
        },
      ]}
    />
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadgeAdmin: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors: { [key: string]: string } = {
    pending: '#2196F3',
    approved: '#4CAF50',
    rejected: '#F44336',
    in_progress: '#FFC107',
  };

  const labels: { [key: string]: string } = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    in_progress: 'Processing',
  };

  const color = colors[status] || '#9E9E9E';
  const label = labels[status] || status;

  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: string | number;
  icon?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color="#666"
          style={styles.rowIcon}
        />
      )}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  riskBadge: {
    borderRadius: 50,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
