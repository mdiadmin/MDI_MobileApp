import { Image, View, Text } from 'react-native'
import {icons} from '../../constants/icons';
import React from 'react'
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
// @ts-ignore: Side-effect CSS import without type declarations

import '@/global.css'

const TabIcon = ({focused, icon, title, iconName}:any) => {
    
    if (focused){
        return (
            <View
                style={{
                    flexDirection: 'row',
                    width: '100%',
                    flex: 1,
                    minWidth: 112,
                    minHeight: 64,
                    marginTop: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 9999,
                    overflow: 'hidden',
                }}
            >
                {iconName ? (
                    <Ionicons name={iconName} size={20} color="#151312" />
                ) : (
                    <Image source={icon}
                        tintColor="#151312" style={{ width: 20, height: 20 }} 
                    />
                )}

                <Text style={{ color:'#151312', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>{title}</Text>

            </View>
        )
    }

    return(
        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 16, borderRadius: 9999 }}>
            {iconName ? (
                <Ionicons name={iconName} size={20} color="#A8B5DB" />
            ) : (
                <Image source={icon} tintColor="#A8B5DB" style={{ width: 20, height: 20 }}/>
            )}
        </View>
    )
}

const _layout = () => {
  return (
    <Tabs 
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle:{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
            },
            tabBarStyle:{
                backgroundColor: '#F8F4F8',
                borderRadius: 50,
                marginHorizontal: 20,
                marginBottom: 36,
                height: 52,
                position: 'absolute',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#F8F4F8'

            }
        }}
    >
        <Tabs.Screen
            name = "index"
            options = {{
                title: "Home",
                headerShown: false,
                tabBarIcon: ({focused}) => (
                    <>
                        <TabIcon focused= {focused} 
                            icon={icons.home}
                            title=""/>
                    </>
                )
            }}
        />   

        <Tabs.Screen
            name = "Announcements"
            options = {{
                title: "Announcements",
                headerShown: false,
                tabBarIcon: ({focused}) => (
                    <>
                        <TabIcon focused= {focused} 
                            icon={icons.announcements}
                            title=""/>
                    </>
                )
            }}
        />

        <Tabs.Screen
            name = "quran"
            options = {{
                title: "Quran",
                headerShown: false,
                tabBarIcon: ({focused}) => (
                    <>
                        <TabIcon focused= {focused} 
                            iconName="book"
                            title=""/>
                    </>
                )
            }}
        />

        <Tabs.Screen
            name = "Settings"
            options = {{
                title: "Settings",
                headerShown: false,
                tabBarIcon: ({focused}) => (
                    <>
                        <TabIcon focused= {focused} 
                            icon={icons.Settings}
                            title=""/>
                    </>
                )
            }}
        /> 
    </Tabs>    
  )
}

export default _layout